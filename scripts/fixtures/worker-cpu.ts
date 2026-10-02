import { app, BrowserWindow } from 'electron'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { create } from '../../packages/main-process/src/parts/WorkerMemoryConnection/WorkerMemoryConnection.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const window = new BrowserWindow({ show: false })
  try {
    await window.loadURL('data:text/html,<body>Worker CPU test</body>')
    const connection = create(window.webContents)
    await connection.execute('WorkerMemory.getTargets')
    await window.webContents.executeJavaScript(`
      globalThis.workers = ['busy', 'idle'].map(name => new Worker(URL.createObjectURL(new Blob([
        name === 'busy' ? 'setInterval(() => { const end = performance.now() + 70; while (performance.now() < end) {} }, 100)' : 'setInterval(() => {}, 1000)'
      ])), {name}))
    `)
    await delay(200)
    const targets = (await connection.execute('WorkerMemory.getTargets')) as string[]
    const sessions = (await connection.execute('WorkerMemory.attach', targets)) as { runtimeName: string; sessionId: string }[]
    assert.equal(sessions.length, 2)
    const ids = sessions.map((s) => s.sessionId)
    const busy = sessions.findIndex((s) => s.runtimeName === 'busy')
    const idle = sessions.findIndex((s) => s.runtimeName === 'idle')
    assert.deepEqual(await connection.execute('WorkerMemory.getCpuUsages', ids), [null, null])
    await delay(1500)
    const before = performance.now()
    const values = (await connection.execute('WorkerMemory.getCpuUsages', ids)) as number[]
    const duration = performance.now() - before
    console.log({ values, duration })
    assert.ok(values[busy] > 30 && values[busy] <= 100, 'busy worker must use its own CPU counter')
    assert.ok(values[idle] < 10, 'idle sibling must not inherit busy worker CPU')
    assert.ok(duration < 500, 'periodic counter reads must not record another trace')
    const heap = (await connection.execute('WorkerMemory.getHeapUsages', ids)) as { usedSize: number }[]
    assert.ok(heap.every((value) => value.usedSize > 0))
    const debuggerApi = window.webContents.debugger
    await debuggerApi.sendCommand('Profiler.enable', {}, ids[busy])
    await debuggerApi.sendCommand('Profiler.start', {}, ids[busy])
    await connection.execute('WorkerMemory.getCpuUsages', ids)
    const { profile } = await debuggerApi.sendCommand('Profiler.stop', {}, ids[busy])
    assert.ok(profile.nodes.length > 0, 'manual profiling must remain usable')
    await debuggerApi.sendCommand('Profiler.disable', {}, ids[busy])
    await window.webContents.executeJavaScript('workers.forEach(worker => worker.terminate())')
    await delay(100)
    assert.deepEqual(await connection.execute('WorkerMemory.getCpuUsages', ids), [null, null])
    await connection.dispose()
    assert.equal(debuggerApi.isAttached(), false)
    const reopened = create(window.webContents)
    assert.deepEqual(await reopened.execute('WorkerMemory.getCpuUsages', ['foreign']), [null])
    await reopened.dispose()
    assert.equal(debuggerApi.isAttached(), false)
    console.log('PASS: independent CPU counters, first/disappeared samples, memory, profiling, and disposal')
  } finally {
    window.destroy()
    app.quit()
  }
}
void main().catch((error) => {
  console.error(error)
  app.exit(1)
})
