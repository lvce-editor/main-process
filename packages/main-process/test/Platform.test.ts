import { expect, test } from '@jest/globals'
import { dirname, join } from 'node:path'
import * as Platform from '../src/parts/Platform/Platform.ts'

test('isProduction', () => {
  expect(typeof Platform.isProduction).toBe('boolean')
})

test('isLinux', () => {
  expect(typeof Platform.isLinux).toBe('boolean')
})

test('getBuiltinSelfTestPath', () => {
  expect(typeof Platform.getBuiltinSelfTestPath()).toBe('string')
})

test('applicationName', () => {
  expect(typeof Platform.applicationName).toBe('string')
})

test('electron paths use the application config directory', () => {
  const configDir = dirname(Platform.getArgvConfigPath())
  expect(Platform.electronUserDataPath).toBe(join(configDir, 'electron'))
  expect(Platform.crashDumpsPath).toBe(join(Platform.electronUserDataPath, 'Crashpad'))
})

test('getVersion', () => {
  expect(typeof Platform.version).toBe('string')
})

test('getCommit', () => {
  expect(typeof Platform.commit).toBe('string')
})

test('getScheme', () => {
  expect(typeof Platform.scheme).toBe('string')
})
