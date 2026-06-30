import { beforeEach, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('../src/parts/Logger/Logger.ts', () => {
  return {
    error: jest.fn(),
    info: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/Process/Process.ts', () => {
  return {
    exit: jest.fn(),
  }
})

jest.unstable_mockModule('../src/parts/PrettyError/PrettyError.ts', () => {
  return {
    prepare: jest.fn(),
  }
})

jest.unstable_mockModule('electron', () => {
  return {
    BrowserWindow: {
      getAllWindows() {
        return []
      },
    },
  }
})

await import('../src/parts/ErrorHandling/ErrorHandling.ts')

test.todo('handleUncaughtExceptionMonitor')

test.todo('handleUnhandledRejection')

test.todo('handleUnhandledRejection - syntax error')
