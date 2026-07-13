import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {},
}))

const ElectronWebContentsViewFunctions = await import('../src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts')

test('capturePage returns a data url', async () => {
  const toDataURL = jest.fn(() => 'data:image/png;base64,c25hcHNob3Q=')
  const capturePage = jest.fn(async () => ({ toDataURL }))
  const view = {
    webContents: {
      capturePage,
    },
  }

  // @ts-expect-error minimal WebContentsView mock
  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toBe('data:image/png;base64,c25hcHNob3Q=')
  expect(capturePage).toHaveBeenCalledTimes(1)
  expect(toDataURL).toHaveBeenCalledTimes(1)
})
