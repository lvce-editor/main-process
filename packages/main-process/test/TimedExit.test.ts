import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const exit = jest.fn()

jest.unstable_mockModule('../src/parts/Exit/Exit.ts', () => ({
  exit,
}))

const TimedExit = await import('../src/parts/TimedExit/TimedExit.ts')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
  jest.resetAllMocks()
})

test('schedule - disabled', () => {
  expect(TimedExit.schedule({})).toBe(false)

  jest.advanceTimersByTime(10_000)

  expect(exit).not.toHaveBeenCalled()
})

test('schedule - exits after 10 seconds', () => {
  expect(TimedExit.schedule({ 'wait-10-seconds': true })).toBe(true)

  jest.advanceTimersByTime(9_999)
  expect(exit).not.toHaveBeenCalled()

  jest.advanceTimersByTime(1)
  expect(exit).toHaveBeenCalledTimes(1)
})
