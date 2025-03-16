import { expect, test } from '@jest/globals'
import { WindowLoadError } from '../src/parts/WindowLoadError/WindowLoadError.js'

test('new WindowLoadError', () => {
  const error = new Error('Failed to load')
  const windowLoadError = new WindowLoadError(error, 'https://example.com')
  expect(windowLoadError.message).toBe('Failed to load url https://example.com: Failed to load')
  expect(windowLoadError.name).toBe('WindowLoadError')
  expect(windowLoadError instanceof Error).toBe(true)
})

test('new WindowLoadError - error with code', () => {
  const error = new Error('Failed to load')
  // @ts-ignore
  error.code = 'ERR_CONNECTION_REFUSED'
  const windowLoadError = new WindowLoadError(error, 'https://example.com')
  expect(windowLoadError.message).toBe('Failed to load url https://example.com: Failed to load')
  expect(windowLoadError.name).toBe('WindowLoadError')
  // @ts-ignore
  expect(windowLoadError.code).toBe('ERR_CONNECTION_REFUSED')
})
