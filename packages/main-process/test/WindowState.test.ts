import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { getRestoredWindowOptions } from '../src/parts/WindowState/GetRestoredWindowOptions.ts'
import { parseWindowState, trackWindowState } from '../src/parts/WindowState/WindowState.ts'

test('parses valid window state', () => {
  expect(parseWindowState('{"width":900,"height":700,"maximized":true}')).toEqual({ height: 700, maximized: true, width: 900 })
})

test.each([
  'invalid json',
  'null',
  '[]',
  '{}',
  '{"width":null,"height":700,"maximized":false}',
  '{"width":"900","height":700,"maximized":false}',
  '{"width":-1,"height":700,"maximized":false}',
  '{"width":0,"height":700,"maximized":false}',
  '{"width":10001,"height":700,"maximized":false}',
  '{"width":900,"height":null,"maximized":false}',
  '{"width":900,"height":700,"maximized":0}',
])('ignores invalid state %s', (content) => {
  expect(parseWindowState(content)).toBeUndefined()
})

test('does not restore bounds when there is no saved state', () => {
  expect(getRestoredWindowOptions(undefined, { height: 800, width: 1200 })).toEqual({})
})

test('limits restored dimensions to the available work area', () => {
  expect(getRestoredWindowOptions({ height: 700, maximized: false, width: 1400 }, { height: 800, width: 1200 })).toEqual({ height: 700, width: 1200 })
})

test('keeps the last normal bounds while the window is maximized', () => {
  const events = new EventEmitter()
  let bounds = { height: 700, width: 900 }
  let maximized = false
  const window = {
    getBounds: () => bounds,
    isMaximized: () => maximized,
    off: events.off.bind(events),
    on: events.on.bind(events),
  }
  const tracker = trackWindowState(window)
  bounds = { height: 800, width: 1100 }
  events.emit('resize')
  maximized = true
  bounds = { height: 1000, width: 1200 }
  events.emit('resize')

  expect(tracker.getState()).toEqual({ height: 800, maximized: true, width: 1100 })
  tracker.dispose()
  expect(events.listenerCount('resize')).toBe(0)
  expect(events.listenerCount('move')).toBe(0)
})
