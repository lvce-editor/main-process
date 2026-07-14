import { beforeEach, expect, jest, test } from '@jest/globals'

const exit = jest.fn()
const quit = jest.fn()

jest.unstable_mockModule('electron', () => ({
  app: {
    exit,
    quit,
  },
}))

const Exit = await import('../src/parts/Exit/Exit.ts')

beforeEach(() => {
  jest.resetAllMocks()
})

test('exit - graceful app quit', () => {
  Exit.exit()
  expect(quit).toHaveBeenCalledTimes(1)
  expect(exit).not.toHaveBeenCalled()
})

test('exit - explicit process exit code', () => {
  Exit.exit(1)
  expect(exit).toHaveBeenCalledWith(1)
  expect(quit).not.toHaveBeenCalled()
})
