import { beforeEach, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('electron', () => {
  return {
    shell: {
      beep: jest.fn(),
      openExternal: jest.fn(),
      openPath: jest.fn(),
      showItemInFolder: jest.fn(),
    },
  }
})

await import('../src/parts/ElectronShell/ElectronShell.ts')

test.todo('showItemInFolder')

test.todo('beep')

test.todo('openExternal')

test.todo('openPath')
