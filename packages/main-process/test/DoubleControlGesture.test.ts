import { expect, test } from '@jest/globals'
import * as DoubleControlGesture from '../src/parts/DoubleControlGesture/DoubleControlGesture.ts'

const input = (type: string, code = 'ControlLeft', extra = {}) => ({ code, type, ...extra })

test.each(['ControlLeft', 'ControlRight'])('recognizes two complete %s taps once', (code) => {
  const gesture = DoubleControlGesture.create()
  expect(gesture.accept(input('keyDown', code), 0)).toBe(false)
  expect(gesture.accept(input('keyUp', code), 100)).toBe(false)
  expect(gesture.accept(input('keyDown', code), 200)).toBe(false)
  expect(gesture.accept(input('keyUp', code), 300)).toBe(true)
  expect(gesture.accept(input('keyUp', code), 301)).toBe(false)
})

test.each([
  [250, 400, 650, true],
  [251, 400, 500, false],
  [100, 400, 501, false],
  [100, 200, 451, false],
])('timing boundaries %i %i %i', (firstRelease, secondPress, secondRelease, expected) => {
  const gesture = DoubleControlGesture.create()
  gesture.accept(input('keyDown'), 0)
  gesture.accept(input('keyUp'), firstRelease)
  gesture.accept(input('keyDown'), secondPress)
  expect(gesture.accept(input('keyUp'), secondRelease)).toBe(expected)
})

test.each([
  input('keyDown', 'KeyC'),
  input('keyDown', 'ShiftLeft'),
  input('keyDown', 'ControlRight'),
  input('keyDown', 'ControlLeft', { alt: true }),
  input('keyDown', 'ControlLeft', { meta: true }),
  input('keyDown', 'ControlLeft', { isComposing: true }),
])('interrupting input cancels the gesture: %j', (interruption) => {
  const gesture = DoubleControlGesture.create()
  gesture.accept(input('keyDown'), 0)
  gesture.accept(input('keyUp'), 50)
  gesture.accept(interruption, 100)
  gesture.accept(input('keyDown'), 150)
  expect(gesture.accept(input('keyUp'), 200)).toBe(false)
})

test('reset cancels an unfinished gesture and auto-repeat cannot add a tap', () => {
  const gesture = DoubleControlGesture.create()
  gesture.accept(input('keyDown'), 0)
  gesture.accept(input('keyDown', 'ControlLeft', { isAutoRepeat: true }), 10)
  expect(gesture.accept(input('keyUp'), 20)).toBe(false)
  gesture.reset()
  gesture.accept(input('keyDown'), 30)
  expect(gesture.accept(input('keyUp'), 40)).toBe(false)
})

test('holding either Ctrl while tapping the other cannot qualify', () => {
  const gesture = DoubleControlGesture.create()
  for (const [type, code, now] of [
    ['keyDown', 'ControlLeft', 0],
    ['keyDown', 'ControlRight', 10],
    ['keyUp', 'ControlRight', 20],
    ['keyDown', 'ControlRight', 30],
    ['keyUp', 'ControlRight', 40],
    ['keyUp', 'ControlLeft', 50],
  ] as const)
    expect(gesture.accept(input(type, code), now)).toBe(false)
  gesture.accept(input('keyDown'), 100)
  expect(gesture.accept(input('keyUp'), 150)).toBe(false)
  gesture.accept(input('keyDown'), 200)
  expect(gesture.accept(input('keyUp'), 250)).toBe(true)
})
