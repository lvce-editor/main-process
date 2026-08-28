import { beforeEach, expect, jest, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerBeforeInput from '../src/parts/ElectronBrowserViewEventListenerBeforeInput/ElectronBrowserViewEventListenerBeforeInput.ts'
import * as ElectronWebContentsViewState from '../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const webContentsId = 12

const createInput = (overrides = {}) => {
  return {
    alt: false,
    control: true,
    key: '+',
    meta: false,
    shift: true,
    type: 'keyDown',
    ...overrides,
  }
}

const createWebContents = (zoomLevel = 0) => {
  return {
    getZoomLevel: jest.fn(() => zoomLevel),
    setZoomLevel: jest.fn(),
  }
}

beforeEach(() => {
  ElectronWebContentsViewState.remove(webContentsId)
  ElectronWebContentsViewState.setFallthroughKeyBindings([])
})

test.each([
  ['+', true],
  ['=', false],
])('zooms in for Ctrl+%s', (key, shift) => {
  const preventDefault = jest.fn()
  const webContents = createWebContents()
  ElectronWebContentsViewState.add(webContentsId, {}, { webContents })

  const result = ElectronBrowserViewEventListenerBeforeInput.handler({ preventDefault }, createInput({ key, shift }), webContentsId)

  expect(result).toEqual({ messages: [], result: undefined })
  expect(preventDefault).toHaveBeenCalledTimes(1)
  expect(webContents.getZoomLevel).toHaveBeenCalledTimes(1)
  expect(webContents.setZoomLevel).toHaveBeenCalledTimes(1)
  expect(webContents.setZoomLevel).toHaveBeenCalledWith(0.2)
})

test('zooms out for Ctrl+-', () => {
  const preventDefault = jest.fn()
  const webContents = createWebContents(0.4)
  ElectronWebContentsViewState.add(webContentsId, {}, { webContents })

  const result = ElectronBrowserViewEventListenerBeforeInput.handler(
    { preventDefault },
    createInput({ key: '-', shift: false }),
    webContentsId,
  )

  expect(result).toEqual({ messages: [], result: undefined })
  expect(preventDefault).toHaveBeenCalledTimes(1)
  expect(webContents.getZoomLevel).toHaveBeenCalledTimes(1)
  expect(webContents.setZoomLevel).toHaveBeenCalledTimes(1)
  expect(webContents.setZoomLevel).toHaveBeenCalledWith(0.2)
})

test('does not zoom without Ctrl', () => {
  const preventDefault = jest.fn()
  const webContents = createWebContents()
  ElectronWebContentsViewState.add(webContentsId, {}, { webContents })

  const result = ElectronBrowserViewEventListenerBeforeInput.handler(
    { preventDefault },
    createInput({ control: false, key: '-', shift: false }),
    webContentsId,
  )

  expect(result).toEqual({ messages: [], result: undefined })
  expect(preventDefault).not.toHaveBeenCalled()
  expect(webContents.getZoomLevel).not.toHaveBeenCalled()
  expect(webContents.setZoomLevel).not.toHaveBeenCalled()
})

test('does not zoom for key-up events', () => {
  const preventDefault = jest.fn()
  const webContents = createWebContents()
  ElectronWebContentsViewState.add(webContentsId, {}, { webContents })

  const result = ElectronBrowserViewEventListenerBeforeInput.handler(
    { preventDefault },
    createInput({ type: 'keyUp' }),
    webContentsId,
  )

  expect(result).toEqual({ messages: [], result: undefined })
  expect(preventDefault).not.toHaveBeenCalled()
  expect(webContents.getZoomLevel).not.toHaveBeenCalled()
  expect(webContents.setZoomLevel).not.toHaveBeenCalled()
})

test('forwards a registered Ctrl+Tab keybinding', () => {
  const preventDefault = jest.fn()
  ElectronWebContentsViewState.setFallthroughKeyBindings([2050])

  const result = ElectronBrowserViewEventListenerBeforeInput.handler(
    { preventDefault },
    createInput({ key: 'Tab', shift: false }),
    webContentsId,
  )

  expect(result).toEqual({ messages: [['handleKeyBinding', 2050]], result: undefined })
  expect(preventDefault).toHaveBeenCalledTimes(1)
})
