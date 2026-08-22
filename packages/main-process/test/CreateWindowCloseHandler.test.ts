import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { createWindowCloseHandler } from '../src/parts/CreateWindowCloseHandler/CreateWindowCloseHandler.ts'

const close = jest.fn()
const off = jest.fn()
const invoke = jest.fn<(method: string) => Promise<void>>()
const onError = jest.fn()
const preventDefault = jest.fn()
const dispose = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
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
  const handleWindowClose = createWindowCloseHandler(window, { invoke }, onError, dispose)

  handleWindowClose(event)

  expect(preventDefault).toHaveBeenCalledTimes(1)
  expect(invoke).toHaveBeenCalledWith('Window.prepareClose')
  expect(close).not.toHaveBeenCalled()

  resolveSave()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()

  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
  expect(dispose).toHaveBeenCalledTimes(1)
  expect(onError).not.toHaveBeenCalled()
})

test('coalesces repeated close requests while state persistence is pending', () => {
  jest.useFakeTimers()
  invoke.mockReturnValue(new Promise<void>(() => {}))
  const handleWindowClose = createWindowCloseHandler({ close, off }, { invoke }, onError)

  handleWindowClose({ preventDefault })
  handleWindowClose({ preventDefault })

  expect(preventDefault).toHaveBeenCalledTimes(2)
  expect(invoke).toHaveBeenCalledTimes(1)
  expect(close).not.toHaveBeenCalled()
})

test('closes the window when renderer state persistence does not finish', async () => {
  jest.useFakeTimers()
  invoke.mockReturnValue(new Promise<void>(() => {}))
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, { invoke }, onError, dispose)

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
  const handleWindowClose = createWindowCloseHandler(window, { invoke }, onError)

  handleWindowClose({ preventDefault })
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()

  expect(onError).toHaveBeenCalledWith(error)
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
})

test('reports disposal errors and still closes the window', async () => {
  const error = new Error('dispose failed')
  invoke.mockResolvedValue(undefined)
  dispose.mockImplementation(() => {
    throw error
  })
  const window = { close, off }
  const handleWindowClose = createWindowCloseHandler(window, { invoke }, onError, dispose)

  handleWindowClose({ preventDefault })
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()

  expect(onError).toHaveBeenCalledWith(error)
  expect(off).toHaveBeenCalledWith('close', handleWindowClose)
  expect(close).toHaveBeenCalledTimes(1)
})
