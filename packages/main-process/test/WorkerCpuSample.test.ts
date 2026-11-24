import { expect, test } from '@jest/globals'
import { parse, percentage } from '../src/parts/WorkerCpuSample/WorkerCpuSample.ts'

const sample = { startTime: '123', ticks: 100, timestamp: 1000 }

test('parses user/system ticks without being confused by spaces or parentheses in thread names', () => {
  const fields = '0 '.repeat(20).trim().split(' ')
  fields[0] = 'R'
  fields[11] = '30'
  fields[12] = '20'
  fields[19] = '123'
  expect(parse(`42 (worker (a) b) ${fields.join(' ')}`, 1000)).toEqual({ ...sample, ticks: 50 })
  expect(parse('missing counters', 1000)).toBeUndefined()
  expect(parse('42 (worker) R', 1000)).toBeUndefined()
})

test('uses one core normalization and kernel tick frequency', () => {
  expect(percentage(sample, { ...sample, ticks: 170, timestamp: 2000 }, 100)).toBe(70)
  expect(percentage(sample, { ...sample, ticks: 100, timestamp: 2000 }, 100)).toBe(0)
  expect(percentage(sample, { ...sample, ticks: 201, timestamp: 2000 }, 100)).toBe(100)
  expect(percentage(sample, { ...sample, ticks: 300, timestamp: 3000 }, 1000)).toBe(10)
})

test('first, reset, replaced, and nonmonotonic samples are unavailable', () => {
  expect(percentage(undefined, sample, 100)).toBeNull()
  expect(percentage(sample, { ...sample, startTime: '456', timestamp: 2000 }, 100)).toBeNull()
  expect(percentage(sample, { ...sample, ticks: 99, timestamp: 2000 }, 100)).toBeNull()
  expect(percentage(sample, sample, 100)).toBeNull()
  expect(percentage(sample, { ...sample, timestamp: 900 }, 100)).toBeNull()
  expect(percentage(sample, { ...sample, timestamp: 2000 }, NaN)).toBeNull()
  expect(percentage(sample, { ...sample, timestamp: 2000 }, 0)).toBeNull()
})
