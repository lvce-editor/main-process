import { expect, test } from '@jest/globals'
import { getFontResponseHeaders } from '../src/parts/GetFontResponseHeaders/GetFontResponseHeaders.ts'

test('adds the bundled font scheme without changing other resource policies or isolation headers', () => {
  const headers = {
    'Content-Security-Policy': ["default-src 'none'; font-src 'self'; worker-src 'self'; connect-src 'self'"],
    'Cross-Origin-Embedder-Policy': ['require-corp'],
    'Cross-Origin-Opener-Policy': ['same-origin'],
  }
  expect(getFontResponseHeaders(headers)).toEqual({
    ...headers,
    'Content-Security-Policy': ["default-src 'none'; font-src 'self' lvce-oss-font:; worker-src 'self'; connect-src 'self'"],
  })
  expect(headers['Content-Security-Policy']).toEqual(["default-src 'none'; font-src 'self'; worker-src 'self'; connect-src 'self'"])
})

test('preserves the default fallback and each independently enforced policy', () => {
  expect(getFontResponseHeaders({ 'content-security-policy': ["default-src 'self'", "default-src 'none'; font-src 'none'"] })).toEqual({
    'content-security-policy': ["default-src 'self'; font-src 'self' lvce-oss-font:", "default-src 'none'; font-src lvce-oss-font:"],
  })
})

test('does not restrict an otherwise unrestricted font policy', () => {
  expect(getFontResponseHeaders({ 'Content-Security-Policy': ["script-src 'self'"] })).toEqual({
    'Content-Security-Policy': ["script-src 'self'"],
  })
  expect(getFontResponseHeaders()).toEqual({})
})
