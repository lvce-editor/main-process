import { expect, test } from '@jest/globals'
import * as ParseCliArgs from '../src/parts/ParseCliArgs/ParseCliArgs.ts'

test('parseCliArgs', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '/test/'])).toEqual({
    _: ['/test/'],
    'built-in-self-test': false,
    help: false,
    sandbox: true,
    v: false,
    version: false,
    wait: false,
    'wait-10-seconds': false,
    web: false,
  })
})

test('parseCliArgs - wait 10 seconds', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '--wait-10-seconds'])).toMatchObject({
    _: [],
    'wait-10-seconds': true,
  })
})

test('parseCliArgs - prompt', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '--prompt', 'Fix the tests'])).toMatchObject({
    _: [],
    prompt: 'Fix the tests',
  })
})

test('parseCliArgs - no sandbox', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '--no-sandbox', '/test/'])).toMatchObject({
    _: ['/test/'],
    sandbox: false,
  })
})

test('parseCliArgs - prompt with equals', () => {
  expect(ParseCliArgs.parseCliArgs(['/usr/lib/lvce-oss/lvce-oss', '--prompt=Fix the tests'])).toMatchObject({
    _: [],
    prompt: 'Fix the tests',
  })
})
