import { jest, test, expect } from '@jest/globals'
import * as GetSharedProcessArgv from '../src/parts/GetSharedProcessArgv/GetSharedProcessArgv.ts'

test('getSharedProcessArgv - production', () => {
  expect(GetSharedProcessArgv.getSharedProcessArgv(true)).toEqual(['--enable-source-maps'])
})

test('getSharedProcessArgv - development', () => {
  expect(GetSharedProcessArgv.getSharedProcessArgv(false)).toEqual([])
})
