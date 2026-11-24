import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type * as StartupCpuProfileModule from '../src/parts/StartupCpuProfile/StartupCpuProfile.ts'

const testDirectory = mkdtempSync(join(tmpdir(), 'lvce-startup-cpu-profile-'))

const app = {
  exit: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  quit: jest.fn(),
  setPath: jest.fn(),
}

const contentTracing = {
  getTraceBufferUsage: jest.fn<() => Promise<{ value: number }>>(),
  startRecording: jest.fn<() => Promise<void>>(),
  stopRecording: jest.fn<(path: string) => Promise<string>>(),
}

jest.unstable_mockModule('electron', () => ({ app, contentTracing }))

let StartupCpuProfile: typeof StartupCpuProfileModule

beforeEach(async () => {
  jest.useFakeTimers()
  jest.resetModules()
  jest.resetAllMocks()
  contentTracing.startRecording.mockResolvedValue()
  contentTracing.getTraceBufferUsage.mockResolvedValue({ value: 0 })
  contentTracing.stopRecording.mockImplementation(() => new Promise(() => {}))
  StartupCpuProfile = await import('../src/parts/StartupCpuProfile/StartupCpuProfile.ts')
})

afterEach(() => {
  jest.useRealTimers()
  rmSync(testDirectory, { force: true, recursive: true })
})

test('writes a manifest that marks a timed out trace as missing', async () => {
  StartupCpuProfile.configure({ 'cpu-profile': true, 'cpu-profile-dir': testDirectory, open: 'target.txt' })
  await StartupCpuProfile.start()

  const completion = StartupCpuProfile.complete('Diagnostics timed out')
  await jest.advanceTimersByTimeAsync(120_000)
  await completion

  const output = readdirSync(testDirectory).find((name) => name.startsWith('lvce-cpu-'))
  expect(output).toBeDefined()
  const manifest = JSON.parse(readFileSync(join(testDirectory, output!, 'manifest.json'), 'utf8'))
  expect(manifest.errors).toEqual(['Diagnostics timed out', 'CPU trace: Error: CPU profile operation timed out'])
  expect(manifest.trace).toBeNull()
  expect(manifest.traceTargets).toBeUndefined()
  expect(manifest.utilities).toEqual([])
  expect(app.quit).toHaveBeenCalledTimes(1)
})

test('allows trace collection to finish after the previous operation timeout', async () => {
  StartupCpuProfile.configure({ 'cpu-profile': true, 'cpu-profile-dir': testDirectory, open: 'target.txt' })
  await StartupCpuProfile.start()
  contentTracing.stopRecording.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 60_000, 'trace.json')))

  const completion = StartupCpuProfile.complete()
  await jest.advanceTimersByTimeAsync(60_000)
  await completion

  const output = readdirSync(testDirectory).find((name) => name.startsWith('lvce-cpu-'))
  expect(output).toBeDefined()
  const manifest = JSON.parse(readFileSync(join(testDirectory, output!, 'manifest.json'), 'utf8'))
  expect(manifest.errors).toEqual([])
  expect(manifest.trace).toBe('trace.json')
  expect(app.quit).toHaveBeenCalledTimes(1)
})
