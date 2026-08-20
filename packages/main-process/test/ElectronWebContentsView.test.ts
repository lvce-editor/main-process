import { beforeEach, expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {},
  webContents: {
    fromId: jest.fn(),
  },
  WebContentsView: class {},
}))

jest.unstable_mockModule('../src/parts/ElectronBrowserViewEventListeners/ElectronBrowserViewEventListeners.ts', () => ({}))

jest.unstable_mockModule('../src/parts/ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts', () => ({
  getSession: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/EmbedsProcess/EmbedsProcess.ts', () => ({
  send: jest.fn(),
}))

const ElectronWebContentsView = await import('../src/parts/ElectronWebContentsView/ElectronWebContentsView.ts')
const ElectronWebContentsViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')

beforeEach(() => {
  for (const id of [1, 2, 3]) {
    ElectronWebContentsViewState.remove(id)
  }
})

test('disposeWebContentsView removes and closes the view', () => {
  const close = jest.fn()
  const removeChildView = jest.fn()
  const view = {
    webContents: {
      close,
    },
  }
  const browserWindow = {
    contentView: {
      removeChildView,
    },
  }
  ElectronWebContentsViewState.add(1, browserWindow, view)

  ElectronWebContentsView.disposeWebContentsView(1)

  expect(removeChildView).toHaveBeenCalledWith(view)
  expect(close).toHaveBeenCalledTimes(1)
  expect(ElectronWebContentsViewState.get(1)).toBeUndefined()
})
