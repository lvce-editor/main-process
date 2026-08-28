import { expect, test } from '@jest/globals'
import * as ElectronBrowserViewEventListenerAudioStateChanged from '../src/parts/ElectronBrowserViewEventListenerAudioStateChanged/ElectronBrowserViewEventListenerAudioStateChanged.ts'

test('forwards audible state', () => {
  expect(ElectronBrowserViewEventListenerAudioStateChanged.handler({ audible: true })).toEqual({
    messages: [['handleAudioStateChanged', true]],
    result: undefined,
  })
})
