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

test('removes conversation fragments from desktop navigation requests', () => {
  expect(getRelativePath('lvce-oss://-/#chat-task-123')).toBe('/')
  expect(getRelativePath('lvce-oss://-/static/main.js#version')).toBe('/static/main.js')
  expect(getRelativePath('lvce-oss://-/?workspace=project#chat-task-123')).toBe('/')
  expect(getRelativePath('lvce-oss://-/static/a%23b.js#fragment')).toBe('/static/a%23b.js')
})
