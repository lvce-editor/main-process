import { expect, test } from '@jest/globals'
import * as Root from '../src/parts/Root/Root.ts'

test('root', () => {
  expect(typeof Root.root).toBe('string')
})
