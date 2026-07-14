import { expect, test } from '@jest/globals'
import * as IsPromptMode from '../src/parts/IsPromptMode/IsPromptMode.ts'

test('isPromptMode - prompt is present', () => {
  expect(IsPromptMode.isPromptMode({ prompt: 'Fix the tests' })).toBe(true)
})

test('isPromptMode - prompt is empty', () => {
  expect(IsPromptMode.isPromptMode({ prompt: '' })).toBe(true)
})

test('isPromptMode - prompt is absent', () => {
  expect(IsPromptMode.isPromptMode({})).toBe(false)
})
