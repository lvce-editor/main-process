import { expect, test } from '@jest/globals'
import * as ApplicationMemoryUsage from '../src/parts/ApplicationMemoryUsage/ApplicationMemoryUsage.ts'

test('reads the reduced-memory option from JSONC settings', () => {
  expect(
    ApplicationMemoryUsage.parseSetting(`{
    // Memory preference
    "application.memoryUsage": "reduce"
  }`),
  ).toBe('reduce')
})

test.each([
  ['missing', '{}'],
  ['default', '{ "application.memoryUsage": "default" }'],
  ['unsupported', '{ "application.memoryUsage": "other" }'],
  ['malformed', '{ "application.memoryUsage": '],
])('uses default mode for %s settings', (_name, content) => {
  expect(ApplicationMemoryUsage.parseSetting(content)).toBe('default')
})
