import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => {
  return {
    clipboard: {
      writeText: jest.fn(),
    },
  }
})

const electron = await import('electron')
const ElectronClipBoard = await import('../src/parts/ElectronClipBoard/ElectronClipBoard.ts')

test('writeText', async () => {
  // @ts-expect-error
  electron.clipboard.writeText.mockImplementation(async () => {})
  await ElectronClipBoard.writeText('abc')
  expect(electron.clipboard.writeText).toHaveBeenCalledTimes(1)
  expect(electron.clipboard.writeText).toHaveBeenCalledWith('abc')
})

test('writeText - error', async () => {
  // @ts-expect-error
  electron.clipboard.writeText.mockImplementation(async () => {
    throw new TypeError('x is not a function')
  })
  await expect(ElectronClipBoard.writeText('abc')).rejects.toThrow(new TypeError('x is not a function'))
})
