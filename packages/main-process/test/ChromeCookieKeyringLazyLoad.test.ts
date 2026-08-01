import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('dbus-native', () => {
  throw new Error('dbus-native was loaded eagerly')
})

test('does not load dbus-native while importing the main-process module', async () => {
  await expect(import('../src/parts/ChromeCookieKeyring/ChromeCookieKeyring.ts')).resolves.toBeDefined()
})
