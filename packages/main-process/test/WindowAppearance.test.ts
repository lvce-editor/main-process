import type { BrowserWindow } from 'electron'
import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import * as WindowAppearance from '../src/parts/WindowAppearance/WindowAppearance.ts'

const createWindow = () => ({
  setBackgroundColor: jest.fn(),
  setTitleBarOverlay: jest.fn(),
  webContents: new EventEmitter(),
})

const appearanceByName = {
  board: {
    backgroundColor: '#ffffff',
    titleBarOverlay: { color: '#00000000', symbolColor: '#202124' },
  },
}

test('applies the selected appearance and restores the original window colors', () => {
  const window = createWindow()
  const titleBarOverlay = { color: '#123456', height: 29, symbolColor: '#abcdef' }
  const browserWindow = window as unknown as BrowserWindow
  WindowAppearance.register(
    browserWindow,
    { backgroundColor: '#101820', titleBarOverlay, titleBarStyle: 'hidden' },
    appearanceByName,
  )

  WindowAppearance.set(browserWindow, 'board')
  expect(window.setBackgroundColor).toHaveBeenCalledWith('#ffffff')
  WindowAppearance.set(browserWindow, 'board')
  expect(window.setBackgroundColor).toHaveBeenCalledTimes(1)
  WindowAppearance.set(browserWindow, null)

  expect(window.setBackgroundColor.mock.calls).toEqual([['#ffffff'], ['#101820']])
  expect(window.setTitleBarOverlay.mock.calls).toEqual(
    process.platform === 'darwin' ? [] : [[{ color: '#00000000', height: 29, symbolColor: '#202124' }], [titleBarOverlay]],
  )
})

test('clears the previous appearance when a new main-frame document loads', () => {
  const window = createWindow()
  const browserWindow = window as unknown as BrowserWindow
  WindowAppearance.register(
    browserWindow,
    { backgroundColor: '#101820', frame: false, titleBarStyle: 'hidden' },
    appearanceByName,
  )

  WindowAppearance.set(browserWindow, 'board')
  window.webContents.emit('did-navigate', {}, 'lvce-oss://-/')
  expect(window.setBackgroundColor.mock.calls).toEqual([['#ffffff'], ['#101820']])
  expect(window.setTitleBarOverlay).not.toHaveBeenCalled()
})
