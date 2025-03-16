import { expect, test } from '@jest/globals'
import * as ShouldOpenExternal from '../src/parts/ShouldOpenExternal/ShouldOpenExternal.ts'

test('shouldOpenExternal - http url', () => {
  expect(ShouldOpenExternal.shouldOpenExternal('http://example.com')).toBe(true)
})

test('shouldOpenExternal - https url', () => {
  expect(ShouldOpenExternal.shouldOpenExternal('https://example.com')).toBe(true)
})

test('shouldOpenExternal - file url', () => {
  expect(ShouldOpenExternal.shouldOpenExternal('file:///test.txt')).toBe(false)
})

test('shouldOpenExternal - empty string', () => {
  expect(ShouldOpenExternal.shouldOpenExternal('')).toBe(false)
})

test('shouldOpenExternal - invalid url', () => {
  expect(ShouldOpenExternal.shouldOpenExternal('invalid-url')).toBe(false)
})
