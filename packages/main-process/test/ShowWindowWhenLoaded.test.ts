import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { showWindowWhenLoaded } from '../src/parts/ShowWindowWhenLoaded/ShowWindowWhenLoaded.ts'

const createWindow = () => Object.assign(new EventEmitter(), { show: jest.fn(), webContents: new EventEmitter() })

test.each(['ready-to-show', 'did-finish-load'])('shows once when %s arrives first', (first) => {
  const window = createWindow()
  showWindowWhenLoaded(window)
  expect(window.show).not.toHaveBeenCalled()
  const target = first === 'ready-to-show' ? window : window.webContents
  target.emit(first)
  expect(window.show).toHaveBeenCalledTimes(1)
  // Late first paint or a subsequent navigation must not reopen a hidden window.
  window.emit('ready-to-show')
  window.webContents.emit('did-finish-load')
  expect(window.show).toHaveBeenCalledTimes(1)
  expect(window.listenerCount('ready-to-show')).toBe(0)
  expect(window.listenerCount('closed')).toBe(0)
  expect(window.webContents.listenerCount('did-finish-load')).toBe(0)
})

test('closing before load removes pending startup listeners', () => {
  const window = createWindow()
  showWindowWhenLoaded(window)
  window.emit('closed')
  window.emit('ready-to-show')
  window.webContents.emit('did-finish-load')
  expect(window.show).not.toHaveBeenCalled()
  expect(window.listenerCount('ready-to-show')).toBe(0)
  expect(window.webContents.listenerCount('did-finish-load')).toBe(0)
})
