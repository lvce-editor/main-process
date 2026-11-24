import { afterEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'

let window: any
jest.unstable_mockModule('electron', () => ({ BrowserWindow: { fromId: () => window } }))
const { handleWorkerMemoryMessagePort } = await import('../src/parts/HandleWorkerMemoryMessagePort/HandleWorkerMemoryMessagePort.ts')

const fixture = () => {
  let attached = false
  const debuggerApi = Object.assign(new EventEmitter(), {
    attach: jest.fn(() => {
      attached = true
    }),
    detach: jest.fn(() => {
      attached = false
    }),
    isAttached: () => attached,
    sendCommand: jest.fn(async () => ({})),
  })
  const webContents = Object.assign(new EventEmitter(), { debugger: debuggerApi })
  window = { webContents }
  const port = Object.assign(new EventEmitter(), { close: jest.fn(), postMessage: jest.fn<(message: unknown) => void>(), start: jest.fn() })
  handleWorkerMemoryMessagePort(port, 1)
  return { debuggerApi, port, webContents }
}

afterEach(() => {
  window = undefined
})

test.each(['port', 'window', 'debugger'])('cleans up all listeners after %s closes', async (cause) => {
  const { debuggerApi, port, webContents } = fixture()
  expect(port.start).toHaveBeenCalledTimes(1)
  if (cause === 'port') port.emit('close')
  else if (cause === 'window') webContents.emit('destroyed')
  else debuggerApi.emit('detach')
  await new Promise((resolve) => setImmediate(resolve))
  expect(port.close).toHaveBeenCalledTimes(1)
  expect(debuggerApi.detach).toHaveBeenCalledTimes(1)
  expect(port.listenerCount('message')).toBe(0)
  expect(port.listenerCount('close')).toBe(0)
  expect(webContents.listenerCount('destroyed')).toBe(0)
  expect(debuggerApi.listenerCount('detach')).toBe(0)
})

test('closes ports for windows that no longer exist', () => {
  const port = { close: jest.fn() }
  handleWorkerMemoryMessagePort(port as any, 1)
  expect(port.close).toHaveBeenCalledTimes(1)
})

test('uses a connection-local command handler and reports unknown methods', async () => {
  const { port } = fixture()
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  port.emit('message', { data: 'ready' })
  port.emit('message', { data: { id: 1, jsonrpc: '2.0', method: 'unknown', params: [] } })
  await new Promise((resolve) => setImmediate(resolve))
  const response = port.postMessage.mock.calls[0][0] as any
  expect(response.id).toBe(1)
  expect(response.error.message).toContain('Unknown worker memory command')
  port.emit('close')
  log.mockRestore()
})
