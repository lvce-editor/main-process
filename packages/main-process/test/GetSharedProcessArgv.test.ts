import { expect, test } from '@jest/globals'
import * as GetSharedProcessArgv from '../src/parts/GetSharedProcessArgv/GetSharedProcessArgv.ts'

test('getSharedProcessArgv', () => {
  expect(GetSharedProcessArgv.getSharedProcessArgv(['/usr/bin/lvce', '--link=/test/one', '--link=/test/two'])).toEqual([
    '--link=/test/one',
    '--link=/test/two',
  ])
})

test('getSharedProcessExecArgv - production', () => {
  expect(GetSharedProcessArgv.getSharedProcessExecArgv(true)).toEqual(['--enable-source-maps'])
})

test('getSharedProcessExecArgv - development', () => {
  expect(GetSharedProcessArgv.getSharedProcessExecArgv(false)).toEqual([])
})
