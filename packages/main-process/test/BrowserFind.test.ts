import { expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import * as BrowserFind from '../src/parts/BrowserFind/BrowserFind.ts'

const createView = () => {
  let requestId = 0
  const contents = Object.assign(new EventEmitter(), {
    findInPage: jest.fn(() => ++requestId),
    isDestroyed: () => false,
    stopFindInPage: jest.fn(),
  })
  return { contents, view: { webContents: contents } as unknown as Electron.WebContentsView }
}

const result = (contents: EventEmitter, requestId: number, finalUpdate = true): void => {
  contents.emit('found-in-page', {}, { activeMatchOrdinal: 2, finalUpdate, matches: 3, requestId })
}

test('waits for the matching final result and cleans up listeners', async () => {
  const { contents, view } = createView()
  const search = BrowserFind.find(view, 'needle', false, true, false)
  result(contents, 100)
  result(contents, 1, false)
  expect(contents.listenerCount('found-in-page')).toBe(1)
  result(contents, 1)
  await expect(search).resolves.toEqual({ activeMatchOrdinal: 2, matches: 3 })
  expect(contents.findInPage).toHaveBeenCalledWith('needle', { findNext: false, forward: false, matchCase: true })
  expect(contents.eventNames()).toEqual([])
})

test('superseding a search settles the old request and ignores its reply', async () => {
  const { contents, view } = createView()
  const first = BrowserFind.find(view, 'a')
  const second = BrowserFind.find(view, 'ab')
  await expect(first).resolves.toBeUndefined()
  result(contents, 1)
  expect(contents.listenerCount('found-in-page')).toBe(1)
  result(contents, 2)
  await expect(second).resolves.toEqual({ activeMatchOrdinal: 2, matches: 3 })
  expect(contents.eventNames()).toEqual([])
})

test('clearing the query cancels pending work and clears native highlights', async () => {
  const { contents, view } = createView()
  const search = BrowserFind.find(view, 'a')
  await expect(BrowserFind.find(view, '')).resolves.toEqual({ activeMatchOrdinal: 0, matches: 0 })
  await expect(search).resolves.toBeUndefined()
  expect(contents.findInPage).toHaveBeenCalledTimes(1)
  expect(contents.stopFindInPage).toHaveBeenCalledWith('clearSelection')
  expect(contents.eventNames()).toEqual([])
})

test.each(['destroyed', 'render-process-gone'])('%s settles pending work', async (event) => {
  const { contents, view } = createView()
  const search = BrowserFind.find(view, 'a')
  contents.emit(event)
  await expect(search).resolves.toBeUndefined()
  expect(contents.eventNames()).toEqual([])
})

test('only main frame document navigation cancels a search', async () => {
  const { contents, view } = createView()
  const search = BrowserFind.find(view, 'a')
  contents.emit('did-start-navigation', {}, 'url', false, false)
  contents.emit('did-start-navigation', {}, 'url#hash', true, true)
  expect(contents.listenerCount('found-in-page')).toBe(1)
  contents.emit('did-start-navigation', {}, 'url', false, true)
  await expect(search).resolves.toBeUndefined()
  expect(contents.eventNames()).toEqual([])
})

test('synchronous failures release listeners', async () => {
  const { contents, view } = createView()
  contents.findInPage.mockImplementation(() => {
    throw new Error('failed')
  })
  await expect(BrowserFind.find(view, 'a')).rejects.toThrow('failed')
  expect(contents.eventNames()).toEqual([])
})
