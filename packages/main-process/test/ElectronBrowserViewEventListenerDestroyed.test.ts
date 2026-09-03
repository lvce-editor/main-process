import { expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerDestroyed from '../src/parts/ElectronBrowserViewEventListenerDestroyed/ElectronBrowserViewEventListenerDestroyed.ts'
import * as ElectronWebContentsViewState from '../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

test('removes a child web contents view after it closes itself', () => {
  const removeChildView = jest.fn()
  const browserWindow = {
    contentView: {
      removeChildView,
    },
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

test('does not forward a second close after an explicit dispose', () => {
  expect(ElectronBrowserViewEventListenerDestroyed.handler({}, 14)).toEqual({
    messages: [],
    result: undefined,
  })
})
