import * as Electron from 'electron'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as PrettyError from '../PrettyError/PrettyError.ts'
import * as WorkerMemoryConnection from '../WorkerMemoryConnection/WorkerMemoryConnection.ts'

export const handleWorkerMemoryMessagePort = (port: Electron.MessagePortMain, windowId: number): void => {
  const window = Electron.BrowserWindow.fromId(windowId)
  if (!window) {
    port.close()
    return
  }
  let connection: ReturnType<typeof WorkerMemoryConnection.create>
  try {
    connection = WorkerMemoryConnection.create(window.webContents)
  } catch (error) {
    port.close()
    throw error
  }
  let closed = false
  const dispose = (): void => {
    if (closed) return
    closed = true
    port.removeListener('message', handleMessage)
    port.removeListener('close', dispose)
    window.webContents.removeListener('destroyed', dispose)
    window.webContents.debugger.removeListener('detach', dispose)
    port.close()
    void connection.dispose().catch(console.error)
  }
  const ipc = {
    send: (message: unknown): void => {
      if (!closed) port.postMessage(message)
    },
  }
  const handleMessage = (event: Electron.MessageEvent): void => {
    if (event.data === 'ready') return
    void JsonRpc.handleJsonRpcMessage({
      execute: connection.execute,
      ipc,
      logError: console.error,
      message: event.data,
      preparePrettyError: PrettyError.prepare,
      requiresSocket: () => false,
    }).catch(console.error)
  }
  port.on('message', handleMessage)
  port.once('close', dispose)
  window.webContents.once('destroyed', dispose)
  window.webContents.debugger.once('detach', dispose)
  port.start()
}
