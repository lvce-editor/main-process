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

test.each(['ControlLeft', 'ControlRight'])('holding %s toggles after 300ms once in host and guest contents', (code) => {
  jest.useFakeTimers()
  const window = createWindow()
  const guest = createWindow().webContents
  const rpc = { send: jest.fn() }
  const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
  BrowserFullWidthGesture.attach(window as any, guest as any)
  BrowserFullWidthGesture.setEnabled(1, true, 'ctrl-hold')
  for (const contents of [window.webContents, guest]) {
    rpc.send.mockClear()
    contents.emit('before-input-event', {}, { code, type: 'keyDown' })
    jest.advanceTimersByTime(299)
    expect(rpc.send).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(rpc.send).toHaveBeenCalledWith('Window.handleBrowserFullWidthGesture')
    contents.emit('before-input-event', {}, { code, isAutoRepeat: true, type: 'keyDown' })
    jest.advanceTimersByTime(1000)
    contents.emit('before-input-event', {}, { code, type: 'keyUp' })
    expect(rpc.send).toHaveBeenCalledTimes(1)
  }
  dispose()
})

test.each(['release', 'shortcut', 'overlap', 'blur', 'focus', 'before-mouse-event', 'destroyed', 'window-blur', 'disable', 'reconfigure', 'dispose'])(
  '%s cancels a pending hold',
  (interruption) => {
    jest.useFakeTimers()
    const window = createWindow()
    const contents = window.webContents
    const rpc = { send: jest.fn() }
    const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
    BrowserFullWidthGesture.setEnabled(1, true, 'ctrl-hold')
    contents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyDown' })
    jest.advanceTimersByTime(200)
    switch (interruption) {
      case 'disable':
        BrowserFullWidthGesture.setEnabled(1, false, 'ctrl-hold')
        break
      case 'dispose':
        dispose()
        break
      case 'overlap':
        contents.emit('before-input-event', {}, { code: 'ControlRight', type: 'keyDown' })
        break
      case 'reconfigure':
        BrowserFullWidthGesture.setEnabled(1, true)
        break
      case 'release':
        contents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyUp' })
        break
      case 'shortcut':
        contents.emit('before-input-event', {}, { code: 'KeyC', type: 'keyDown' })
        break
      case 'window-blur':
        window.emit('blur')
        break
      default:
        contents.emit(interruption)
    }
    jest.advanceTimersByTime(1000)
    expect(rpc.send).not.toHaveBeenCalled()
    dispose()
  },
)

test.each([{ alt: true }, { meta: true }, { shift: true }, { isComposing: true }, { isAutoRepeat: true }])(
  'modified or repeated input cannot start a hold: %j',
  (extra) => {
    jest.useFakeTimers()
    const window = createWindow()
    const rpc = { send: jest.fn() }
    const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
    BrowserFullWidthGesture.setEnabled(1, true, 'ctrl-hold')
    window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyDown', ...extra })
    jest.runAllTimers()
    expect(rpc.send).not.toHaveBeenCalled()
    dispose()
  },
)

test('switching modes replaces the gesture and defaults to double Ctrl', () => {
  jest.useFakeTimers()
  const window = createWindow()
  const rpc = { send: jest.fn() }
  const dispose = BrowserFullWidthGesture.listen(window as any, rpc as any)
  BrowserFullWidthGesture.setEnabled(1, true, 'ctrl-hold')
  doubleTap(window.webContents)
  jest.runAllTimers()
  expect(rpc.send).not.toHaveBeenCalled()
  BrowserFullWidthGesture.setEnabled(1, true)
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyDown' })
  jest.advanceTimersByTime(300)
  window.webContents.emit('before-input-event', {}, { code: 'ControlLeft', type: 'keyUp' })
  expect(rpc.send).not.toHaveBeenCalled()
  doubleTap(window.webContents)
  jest.runAllTimers()
  expect(rpc.send).toHaveBeenCalledTimes(1)
  dispose()
})
