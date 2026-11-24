import { expect, test } from '@jest/globals'
import * as ApplicationProtocolRegisterSource from '../src/parts/ApplicationProtocolRegisterSource/ApplicationProtocolRegisterSource.ts'

test('reads the native protocol source option from JSONC settings', () => {
  expect(
    ApplicationProtocolRegisterSource.parseSetting(`{
    // Enable native loading for bundled resources
    "application.useProtocolRegisterSource": true
  }`),
  ).toBe(true)
})

test.each([
  ['missing', '{}'],
  ['false', '{ "application.useProtocolRegisterSource": false }'],
  ['unsupported', '{ "application.useProtocolRegisterSource": "true" }'],
  ['malformed', '{ "application.useProtocolRegisterSource": '],
  ['incomplete enabled value', '{ "application.useProtocolRegisterSource": true '],
  ['trailing garbage', '{ "application.useProtocolRegisterSource": true } garbage'],
  ['null', 'null'],
])('keeps native protocol source disabled for %s settings', (_name, content) => {
  expect(ApplicationProtocolRegisterSource.parseSetting(content)).toBe(false)
})

test('reads a compact boolean value', () => {
  expect(ApplicationProtocolRegisterSource.parseSetting('{"application.useProtocolRegisterSource":true}')).toBe(true)
})
