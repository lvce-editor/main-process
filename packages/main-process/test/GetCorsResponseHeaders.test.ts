import { expect, test } from '@jest/globals'
import * as GetCorsResponseHeaders from '../src/parts/GetCorsResponseHeaders/GetCorsResponseHeaders.ts'

test('getCorsResponseHeaders - adds access control allow origin header', () => {
  expect(
    GetCorsResponseHeaders.getCorsResponseHeaders({
      'Content-Type': ['application/octet-stream'],
    }),
  ).toEqual({
    'Access-Control-Allow-Origin': ['*'],
    'Content-Type': ['application/octet-stream'],
  })
})

test('getCorsResponseHeaders - preserves existing access control allow origin header case-insensitively', () => {
  expect(
    GetCorsResponseHeaders.getCorsResponseHeaders({
      'access-control-allow-origin': ['*'],
      'Content-Type': ['application/json'],
    }),
  ).toEqual({
    'access-control-allow-origin': ['*'],
    'Content-Type': ['application/json'],
  })
})

test('getCorsResponseHeaders - supports missing response headers', () => {
  expect(GetCorsResponseHeaders.getCorsResponseHeaders()).toEqual({
    'Access-Control-Allow-Origin': ['*'],
  })
})
