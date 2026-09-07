import { expect, test } from '@jest/globals'
import { handler } from '../src/parts/ElectronBrowserViewEventListenerContextMenu/ElectronBrowserViewEventListenerContextMenu.ts'

test('preserves the originating browser id even through bridges that omit positional ids', () => {
  expect(handler({}, { linkURL: 'https://example.com', x: 10, y: 20 }, 42)).toEqual({
    messages: [['handleContextMenu', { browserViewId: 42, linkURL: 'https://example.com', x: 10, y: 20 }]],
    result: undefined,
  })
})
