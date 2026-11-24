import type { WebContents } from 'electron'
import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import { trackWindowRenderer } from '../src/parts/TrackWindowRenderer/TrackWindowRenderer.ts'

test('only a failed application preload bypasses renderer close confirmation', () => {
  const webContents = Object.assign(new EventEmitter(), { isCrashed: () => false })
  const available = trackWindowRenderer(webContents as unknown as WebContents, '/app/preload.js')
  expect(available()).toBe(true)
  webContents.emit('preload-error', {}, '/extension/preload.js')
  expect(available()).toBe(true)
  webContents.emit('preload-error', {}, '/app/preload.js')
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/', false, false)
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/#fragment', true, true)
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/', false, true)
  expect(available()).toBe(true)
})

test('a crashed renderer cannot answer close confirmation', () => {
  const webContents = Object.assign(new EventEmitter(), { isCrashed: () => true })
  expect(trackWindowRenderer(webContents as unknown as WebContents, undefined)()).toBe(false)
})
