import { expect, test } from '@jest/globals'
import * as ParseCliArgs from '../src/parts/ParseCliArgs/ParseCliArgs.ts'

test('parseCliArgs', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '/test/'])).toEqual({
    _: ['/test/'],
    'built-in-self-test': false,
    help: false,
    sandbox: false,
    v: false,
    version: false,
    wait: false,
    web: false,
  })
})
