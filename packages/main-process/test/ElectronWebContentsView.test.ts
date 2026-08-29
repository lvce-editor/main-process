import { beforeEach, expect, jest, test } from '@jest/globals'

const addChildView = jest.fn()
const listenerAttach = jest.fn()
const navigationFocusAttach = jest.fn()
const performanceAttach = jest.fn()
const send = jest.fn()
const setBounds = jest.fn()
const webContents = {
  id: 1,
}
const view = {
  setBounds,
  webContents,
}
const browserWindow = {
  contentView: {
    addChildView,
  },
  webContents: {},
}
const fromId = jest.fn(() => webContents)

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {
    getAllWindows: jest.fn(() => [browserWindow]),
    getFocusedWindow: jest.fn(() => browserWindow),
  },
  webContents: {
    fromId,
  },
  WebContentsView: jest.fn(() => view),
}))

jest.unstable_mockModule('../src/parts/ElectronBrowserViewEventListeners/ElectronBrowserViewEventListeners.ts', () => ({
  pageFaviconUpdated: {
    attach: listenerAttach,
    async handler(event, favicons) {
      return {
        messages: [['handlePageFaviconUpdated', favicons]],
        result: undefined,
      }
    },
  },
}))

jest.unstable_mockModule('../src/parts/ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts', () => ({
  getSession: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/ElectronWebContentsViewNavigationFocus/ElectronWebContentsViewNavigationFocus.ts', () => ({
  attach: navigationFocusAttach,
}))

jest.unstable_mockModule('../src/parts/ElectronWebContentsViewPerformance/ElectronWebContentsViewPerformance.ts', () => ({
  attach: performanceAttach,
}))

jest.unstable_mockModule('../src/parts/EmbedsProcess/EmbedsProcess.ts', () => ({
  send,
}))

const ElectronWebContentsView = await import('../src/parts/ElectronWebContentsView/ElectronWebContentsView.ts')
const ElectronWebContentsViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')

beforeEach(() => {
  jest.clearAllMocks()
  for (const id of [1, 2, 3]) {
    ElectronWebContentsViewState.remove(id)
  }
})

test('createWebContentsView attaches event listeners before returning', async () => {
  await expect(ElectronWebContentsView.createWebContentsView()).resolves.toBe(1)

  expect(addChildView).toHaveBeenCalledWith(view, 0)
  expect(navigationFocusAttach).toHaveBeenCalledWith(webContents, browserWindow.webContents)
  expect(performanceAttach).toHaveBeenCalledWith(webContents)
  expect(listenerAttach).toHaveBeenCalledWith(webContents, expect.any(Function))

  const listener = listenerAttach.mock.calls[0][1] as (event: unknown, favicons: readonly string[]) => Promise<void>
  await listener({}, ['https://example.com/favicon.png'])

  expect(send).toHaveBeenCalledWith('ElectronWebContents.handlePageFaviconUpdated', 1, ['https://example.com/favicon.png'])

  ElectronWebContentsView.attachEventListeners(1)
  expect(listenerAttach).toHaveBeenCalledTimes(1)
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
