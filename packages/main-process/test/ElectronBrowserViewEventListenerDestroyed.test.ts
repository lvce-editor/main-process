import { expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerDestroyed from '../src/parts/ElectronBrowserViewEventListenerDestroyed/ElectronBrowserViewEventListenerDestroyed.ts'
import * as ElectronWebContentsViewState from '../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

test('removes a child web contents view after it closes itself', () => {
  const removeChildView = jest.fn()
  const browserWindow = {
    contentView: {
      removeChildView,
    },
    isDestroyed: () => false,
  }
  const view = { webContents: { id: 13 } }
  ElectronWebContentsViewState.add(13, browserWindow, view)

  expect(ElectronBrowserViewEventListenerDestroyed.handler({}, 13)).toEqual({
    messages: [['handleBrowserViewDestroyed']],
    result: undefined,
  })

  expect(removeChildView).toHaveBeenCalledWith(view)
  expect(ElectronWebContentsViewState.get(13)).toBeUndefined()
})

test('does not access the browser window after it has been destroyed', () => {
  const browserWindow = {
    get contentView(): never {
      throw new Error('Object has been destroyed')
    },
    isDestroyed: () => true,
  }
  const view = { webContents: { id: 14 } }
  ElectronWebContentsViewState.add(14, browserWindow, view)

  expect(ElectronBrowserViewEventListenerDestroyed.handler({}, 14)).toEqual({
    messages: [['handleBrowserViewDestroyed']],
    result: undefined,
  })

  expect(ElectronWebContentsViewState.get(14)).toBeUndefined()
})

test('does not forward a second close after an explicit dispose', () => {
  expect(ElectronBrowserViewEventListenerDestroyed.handler({}, 15)).toEqual({
    messages: [],
    result: undefined,
  })
})
