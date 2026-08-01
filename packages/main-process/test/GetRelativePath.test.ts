import { expect, test } from '@jest/globals'
import { getRelativePath } from '../src/parts/GetRelativePath/GetRelativePath.ts'

test('returns the relative path', () => {
  expect(getRelativePath('lvce-oss://-/static/main.js')).toBe('/static/main.js')
})

test('removes query parameters from the root path', () => {
  expect(getRelativePath('lvce-oss://-/?workspace=file%3A%2F%2F%2Ftmp&openUri=file%3A%2F%2F%2Ftmp%2Fexample.txt')).toBe('/')
})

test('removes query parameters from a resource path', () => {
  expect(getRelativePath('lvce-oss://-/static/main.js?v=1')).toBe('/static/main.js')
})
