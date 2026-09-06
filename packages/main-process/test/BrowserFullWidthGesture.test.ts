import { afterEach, expect, jest, test } from '@jest/globals'
import EventEmitter from 'node:events'
import * as BrowserFullWidthGesture from '../src/parts/BrowserFullWidthGesture/BrowserFullWidthGesture.ts'

const createWindow = () => {
  const contents = Object.assign(new EventEmitter(), { isDestroyed: () => false, isFocused: () => true })
  return Object.assign(new EventEmitter(), { id: 1, isFocused: () => true, webContents: contents })
}
const doubleTap = (contents) => {
  for (const type of ['keyDown', 'keyUp', 'keyDown', 'keyUp']) {
    contents.emit('before-input-event', {}, { code: 'ControlLeft', type })
  }
}

afterEach(() => {
  jest.useRealTimers()
})

test('requires registration, forwards from guest contents once, and disposes listeners', () => {
  jest.useFakeTimers()
  const window = createWindow()
  const guest = createWindow().webContents
  const rpc = { send: jest.fn() }
  const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
  doubleTap(window.webContents)
  jest.runAllTimers()
  expect(rpc.send).not.toHaveBeenCalled()
  BrowserFullWidthGesture.setEnabled(1, true)
  BrowserFullWidthGesture.attach(window as any, guest as any)
  BrowserFullWidthGesture.attach(window as any, guest as any)
  expect(guest.listenerCount('before-input-event')).toBe(1)
  doubleTap(guest)
  expect(rpc.send).not.toHaveBeenCalled()
  jest.runAllTimers()
  expect(rpc.send).toHaveBeenCalledTimes(1)
  expect(rpc.send).toHaveBeenCalledWith('Window.handleBrowserFullWidthGesture')
  doubleTap(guest)
  dispose()
  jest.runAllTimers()
  expect(rpc.send).toHaveBeenCalledTimes(1)
  expect(guest.listenerCount('before-input-event')).toBe(0)
  expect(window.webContents.listenerCount('before-input-event')).toBe(0)
})

test.each(['blur', 'focus', 'before-mouse-event'])('%s interrupts the gesture', (event) => {
  jest.useFakeTimers()
  const window = createWindow()
  const rpc = { send: jest.fn() }
  const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
  BrowserFullWidthGesture.setEnabled(1, true)
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyDown' })
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyUp' })
  window.webContents.emit(event)
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyDown' })
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyUp' })
  jest.runAllTimers()
  expect(rpc.send).not.toHaveBeenCalled()
  dispose()
})
