import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { createWindowCloseHandler } from '../src/parts/CreateWindowCloseHandler/CreateWindowCloseHandler.ts'

const close = jest.fn()
const off = jest.fn()
const invoke = jest.fn<(method: string) => Promise<void>>()
const permission = jest.fn<() => Promise<boolean>>()
const rpc = { invoke: (method: string): Promise<unknown> => (method === 'Window.canClose' ? permission() : invoke(method)) }
const onError = jest.fn()
const preventDefault = jest.fn()
const dispose = jest.fn()

const flushClose = async (): Promise<void> => {
  await new Promise<void>((resolve) => setImmediate(resolve))
}

beforeEach(() => {
  jest.resetAllMocks()
  permission.mockResolvedValue(true)
})

afterEach(() => {
  jest.useRealTimers()
})

test('waits for renderer state persistence before closing the window', async () => {
  let resolveSave: () => void = () => {}
  invoke.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveSave = resolve
    }),
  )
  const window = { close, off }
  const event = { preventDefault }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, dispose)

  handleWindowClose(event)

  expect(preventDefault).toHaveBeenCalledTimes(1)
  await Promise.resolve()
  expect(invoke).toHaveBeenCalledWith('Window.prepareClose')
  expect(close).not.toHaveBeenCalled()

  resolveSave()
  await flushClose()

  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(onError).not.toHaveBeenCalled()
})

test('persists window state before closing the live window', async () => {
  const order: string[] = []
  invoke.mockImplementation(async () => {
    order.push('renderer')
  })
  const window = {
    close: jest.fn(() => {
      order.push('close')
    }),
    off: jest.fn(),
  }
  const persistState = jest.fn(async () => {
    order.push('window-state')
  })
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, undefined, persistState)

  handleWindowClose({ preventDefault })
  await flushClose()

  expect(order).toEqual(['renderer', 'window-state', 'close'])
  expect(persistState).toHaveBeenCalledTimes(1)
})

test('closes the window when window state storage does not finish', async () => {
  jest.useFakeTimers()
  const closeWindow = jest.fn()
  const handleWindowClose = createWindowCloseHandler(
    { close: closeWindow, off },
    { invoke: async () => {} },
    onError,
    undefined,
    () => new Promise<void>(() => {}),
  )

  handleWindowClose({ preventDefault })
  await jest.advanceTimersByTimeAsync(1000)

  expect(onError).not.toHaveBeenCalled()
  expect(closeWindow).toHaveBeenCalledTimes(1)
})

test('coalesces repeated close requests while state persistence is pending', async () => {
  jest.useFakeTimers()
  invoke.mockReturnValue(new Promise<void>(() => {}))
  const handleWindowClose = createWindowCloseHandler({ close, off }, rpc, onError)

  handleWindowClose({ preventDefault })
  handleWindowClose({ preventDefault })

  expect(preventDefault).toHaveBeenCalledTimes(2)
  await Promise.resolve()
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(close).not.toHaveBeenCalled()
})

test('closes the window when renderer state persistence does not finish', async () => {
  jest.useFakeTimers()
  invoke.mockReturnValue(new Promise<void>(() => {}))
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, dispose)

  handleWindowClose({ preventDefault })
  await jest.advanceTimersByTimeAsync(1000)

  expect(onError).toHaveBeenCalledWith(new Error('Timed out preparing window close after 1000ms'))
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
})

test('reports persistence errors and still closes the window', async () => {
  const error = new Error('save failed')
  invoke.mockRejectedValue(error)
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError)

  handleWindowClose({ preventDefault })
  await flushClose()

  expect(onError).toHaveBeenCalledWith(error)
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
})

test('does not report an error when the renderer frame is disposed asynchronously', async () => {
  jest.useFakeTimers()
  const error = new Error('Render frame was disposed before WebFrameMain could be accessed')
  invoke.mockRejectedValue(error)
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, dispose)

  handleWindowClose({ preventDefault })
  await jest.runAllTimersAsync()

  expect(onError).not.toHaveBeenCalled()
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('does not report an error when the renderer frame is disposed synchronously', async () => {
  jest.useFakeTimers()
  const error = new Error('Render frame was disposed before WebFrameMain could be accessed')
  invoke.mockImplementation(() => {
    throw error
  })
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, dispose)

  handleWindowClose({ preventDefault })
  await jest.runAllTimersAsync()

  expect(onError).not.toHaveBeenCalled()
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('reports disposal errors and still closes the window', async () => {
  const error = new Error('dispose failed')
  invoke.mockResolvedValue(undefined)
  dispose.mockImplementation(() => {
    throw error
  })
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, rpc, onError, dispose)

  handleWindowClose({ preventDefault })
  await flushClose()

  expect(onError).toHaveBeenCalledWith(error)
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
})

test('cancelled close preserves the live window and allows retry', async () => {
  permission.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  const handle = createWindowCloseHandler({ close, off }, rpc, onError, dispose)
  handle({ preventDefault })
  await flushClose()
  expect(close).not.toHaveBeenCalled()
  expect(dispose).not.toHaveBeenCalled()
  expect(invoke).not.toHaveBeenCalled()
  handle({ preventDefault })
  await flushClose()
  expect(close).toHaveBeenCalledTimes(1)
})

test('user confirmation is not limited by the state persistence deadline', async () => {
  jest.useFakeTimers()
  const confirmation = Promise.withResolvers<boolean>()
  permission.mockReturnValue(confirmation.promise)
  const handle = createWindowCloseHandler({ close, off }, rpc, onError, dispose)
  handle({ preventDefault })
  handle({ preventDefault })
  await jest.advanceTimersByTimeAsync(5000)
  expect(close).not.toHaveBeenCalled()
  expect(permission).toHaveBeenCalledTimes(1)
  confirmation.resolve(false)
  await jest.advanceTimersByTimeAsync(0)
  expect(dispose).not.toHaveBeenCalled()
})

test('failed document save prevents closing and permits retry', async () => {
  const error = new Error('write failed')
  permission.mockRejectedValueOnce(error).mockResolvedValueOnce(true)
  const handle = createWindowCloseHandler({ close, off }, rpc, onError, dispose)
  handle({ preventDefault })
  await flushClose()
  expect(close).not.toHaveBeenCalled()
  expect(onError).toHaveBeenCalledWith(error)
  handle({ preventDefault })
  await flushClose()
  expect(close).toHaveBeenCalledTimes(1)
})

test('legacy renderer without the permission command retains state persistence', async () => {
  permission.mockRejectedValue(new Error('Command not found Window.canClose'))
  const handle = createWindowCloseHandler({ close, off }, rpc, onError, dispose)
  handle({ preventDefault })
  await flushClose()
  expect(invoke).toHaveBeenCalledWith('Window.prepareClose')
  expect(close).toHaveBeenCalledTimes(1)
  expect(onError).not.toHaveBeenCalled()
})
