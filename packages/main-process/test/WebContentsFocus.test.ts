import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import * as WebContentsFocus from '../src/parts/WebContentsFocus/WebContentsFocus.ts'

test('tracks the latest native page focus with one listener per contents', () => {
  const contents = new EventEmitter() as any
  const now = jest.spyOn(Date, 'now').mockReturnValue(100)
  WebContentsFocus.attach(contents)
  WebContentsFocus.attach(contents)
  expect(contents.listenerCount('focus')).toBe(1)
  expect(WebContentsFocus.getLastFocusedAt(contents)).toBe(0)
  contents.emit('focus')
  expect(WebContentsFocus.getLastFocusedAt(contents)).toBe(100)
  now.mockReturnValue(200)
  contents.emit('focus')
  expect(WebContentsFocus.getLastFocusedAt(contents)).toBe(200)
  now.mockRestore()
})
