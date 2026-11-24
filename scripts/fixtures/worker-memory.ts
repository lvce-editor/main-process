import { app, BrowserWindow, ipcMain } from 'electron'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { handleWorkerMemoryMessagePort } from '../../packages/main-process/src/parts/HandleWorkerMemoryMessagePort/HandleWorkerMemoryMessagePort.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: false, nodeIntegration: true } })
  const commands: string[] = []
  const debuggerApi = window.webContents.debugger
  const sendCommand = debuggerApi.sendCommand.bind(debuggerApi)
  debuggerApi.sendCommand = async (method, ...args) => {
    commands.push(method)

    return sendCommand(method, ...args)
  }
  ipcMain.on('worker-memory-port', (event) => handleWorkerMemoryMessagePort(event.ports[0], window.id))
  try {
    await window.loadURL('data:text/html,<body>Worker memory test</body>')
    const workerSource = `
    onmessage = async ({ data: port }) => {
      let id = 0
      const callbacks = new Map()
      port.onmessage = ({ data }) => {
        const callback = callbacks.get(data.id)
        if (callback) { callbacks.delete(data.id); data.error ? callback.reject(new Error(data.error.message)) : callback.resolve(data.result) }
      }
      const invoke = (method, ...params) => new Promise((resolve, reject) => {
        callbacks.set(++id, { resolve, reject })
        port.postMessage({ jsonrpc: '2.0', id, method, params })
      })
      try {
        const targets = await invoke('WorkerMemory.getTargets')
        const sessions = (await invoke('WorkerMemory.attach', targets)).filter(Boolean)
        const sizes = []
        for (let i = 0; i < 3; i++) sizes.push(await invoke('WorkerMemory.getHeapUsages', sessions.map(s => s.sessionId)))
        postMessage({ names: sessions.map(s => s.runtimeName), sizes })
        onmessage = () => port.close()
      } catch (error) { postMessage({ error: error.message }) }
    }
  `
    const completed = Promise.withResolvers<any>()
    ipcMain.once('worker-memory-result', (_event, result) => completed.resolve(result))
    await window.webContents.executeJavaScript(`
    (() => {
      const { ipcRenderer } = require('electron')
      globalThis.memoryWorker = new Worker(URL.createObjectURL(new Blob([${JSON.stringify(workerSource)}], { type: 'text/javascript' })), { name: 'Memory test worker' })
      memoryWorker.onmessage = ({ data }) => ipcRenderer.send('worker-memory-result', data)
      memoryWorker.onerror = (error) => ipcRenderer.send('worker-memory-result', { error: error.message })
      const { port1, port2 } = new MessageChannel()
      ipcRenderer.postMessage('worker-memory-port', null, [port1])
      memoryWorker.postMessage(port2, [port2])
    })()
  `)
    const result = await completed.promise
    assert.equal(result.error, undefined)
    assert.deepEqual(result.names, ['Memory test worker'])
    assert.equal(result.sizes.length, 3)
    for (const [usage] of result.sizes) assert.ok(usage.usedSize > 0)
    assert.equal(commands.filter((method) => method === 'Runtime.evaluate').length, 1)
    assert.equal(commands.filter((method) => method === 'Target.attachToTarget').length, 2)
    assert.equal(commands.filter((method) => method === 'Target.detachFromTarget').length, 0)
    assert.equal(debuggerApi.isAttached(), true)
    await window.webContents.executeJavaScript('memoryWorker.postMessage("close")')
    for (let i = 0; i < 100 && debuggerApi.isAttached(); i++) await delay(10)
    assert.equal(debuggerApi.isAttached(), false, 'closing the worker port must release the debugger')
    assert.equal(commands.filter((method) => method === 'Target.detachFromTarget').length, 2)
    console.log('PASS: one name evaluation, three heap queries, and automatic cleanup on worker port close')
  } finally {
    window.destroy()
    app.quit()
  }
}
void main().catch((error) => {
  console.error(error)
  app.exit(1)
})
