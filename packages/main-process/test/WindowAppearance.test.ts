import type { BrowserWindow } from 'electron'
import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import * as WindowAppearance from '../src/parts/WindowAppearance/WindowAppearance.ts'

const createWindow = () => ({
  setBackgroundColor: jest.fn(),
  setTitleBarOverlay: jest.fn(),
  webContents: new EventEmitter(),
})

const appearanceByPath = {
  '/boards': {
    backgroundColor: '#ffffff',
    titleBarOverlay: { color: '#00000000', symbolColor: '#202124' },
  },
}

test('tracks the main-frame path and restores the original window colors', () => {
  const window = createWindow()
  const titleBarOverlay = { color: '#123456', height: 29, symbolColor: '#abcdef' }
  WindowAppearance.track(
    window as unknown as BrowserWindow,
    { backgroundColor: '#101820', titleBarOverlay, titleBarStyle: 'hidden' },
    appearanceByPath,
    'lvce-oss://-/',
  )

  window.webContents.emit('did-navigate-in-page', {}, 'lvce-oss://-/boards', false)
  expect(window.setBackgroundColor).not.toHaveBeenCalled()
  window.webContents.emit('did-navigate-in-page', {}, 'lvce-oss://-/boards', true)
  window.webContents.emit('did-navigate-in-page', {}, 'lvce-oss://-/boards?search=x', true)
  window.webContents.emit('did-navigate', {}, 'lvce-oss://-/chat')
  window.webContents.emit('did-navigate', {}, 'https://example.com/boards')

  expect(window.setBackgroundColor.mock.calls).toEqual([['#ffffff'], ['#101820']])
  expect(window.setTitleBarOverlay.mock.calls).toEqual(
    process.platform === 'darwin' ? [] : [[{ color: '#00000000', height: 29, symbolColor: '#202124' }], [titleBarOverlay]],
  )
})

test('applies colors before loading an initial route without enabling native controls', () => {
  const window = createWindow()
  WindowAppearance.track(
    window as unknown as BrowserWindow,
    { backgroundColor: '#101820', frame: false, titleBarStyle: 'hidden' },
    appearanceByPath,
    'lvce-oss://-/boards?search=x',
  )

  expect(window.setBackgroundColor).toHaveBeenCalledWith('#ffffff')
  expect(window.setTitleBarOverlay).not.toHaveBeenCalled()
})
