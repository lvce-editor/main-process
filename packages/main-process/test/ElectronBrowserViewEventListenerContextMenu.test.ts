import { expect, test } from '@jest/globals'
import { handler } from '../src/parts/ElectronBrowserViewEventListenerContextMenu/ElectronBrowserViewEventListenerContextMenu.ts'

test('preserves the originating browser id even through bridges that omit positional ids', () => {
  expect(handler({}, { x: 10, y: 20, linkURL: 'https://example.com' }, 42)).toEqual({
    messages: [['handleContextMenu', { browserViewId: 42, x: 10, y: 20, linkURL: 'https://example.com' }]],
    result: undefined,
  })
})
