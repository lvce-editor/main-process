import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const testCacheDir = join(tmpdir(), `lvce-main-process-${randomUUID()}`)

beforeEach(async () => {
  jest.resetAllMocks()
  await rm(testCacheDir, { recursive: true, force: true })
})

afterEach(async () => {
  await rm(testCacheDir, { recursive: true, force: true })
})

jest.unstable_mockModule('electron', () => {
  return {
    contentTracing: {
      decryptString: jest.fn(),
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
    },
  }
})

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => {
  return {
    cacheDir: testCacheDir,
  }
})

const electron = await import('electron')
const ElectronContentTracing = await import('../src/parts/ElectronContentTracing/ElectronContentTracing.ts')

test('startRecording - error', async () => {
  // @ts-expect-error
  electron.contentTracing.startRecording.mockImplementation(async () => {
    throw new TypeError('x is not a function')
  })
  await expect(async () =>
    ElectronContentTracing.startRecording({
      included_categories: ['*'],
    }),
  ).rejects.toThrow(new TypeError('x is not a function'))
})

test('startRecording', async () => {
  // @ts-expect-error
  electron.contentTracing.startRecording.mockImplementation(() => {
    return 'encrypted'
  })
  await ElectronContentTracing.startRecording({
    included_categories: ['*'],
  })
  expect(electron.contentTracing.startRecording).toHaveBeenCalledTimes(1)
  expect(electron.contentTracing.startRecording).toHaveBeenCalledWith({
    included_categories: ['*'],
  })
})

test('stopRecording - creates cache directory and saves readable trace', async () => {
  // @ts-expect-error
  electron.contentTracing.stopRecording.mockImplementation(async (path) => {
    await writeFile(path, '{"traceEvents":[]}')
    return path
  })

  const tracePath = await ElectronContentTracing.stopRecording()

  expect(tracePath).toMatch(new RegExp(`^${testCacheDir}/traces/trace-.+\\.json$`))
  expect(JSON.parse(await readFile(tracePath, 'utf8'))).toEqual({ traceEvents: [] })
  expect(electron.contentTracing.stopRecording).toHaveBeenCalledWith(tracePath)
})

test('stopRecording - repeated recordings use distinct files', async () => {
  // @ts-expect-error
  electron.contentTracing.stopRecording.mockImplementation(async (path) => {
    await writeFile(path, '{"traceEvents":[]}')
    return path
  })

  const firstTracePath = await ElectronContentTracing.stopRecording()
  const secondTracePath = await ElectronContentTracing.stopRecording()

  expect(secondTracePath).not.toBe(firstTracePath)
  expect(await readFile(firstTracePath, 'utf8')).toBe('{"traceEvents":[]}')
  expect(await readFile(secondTracePath, 'utf8')).toBe('{"traceEvents":[]}')
})

test('stopRecording - directory creation error', async () => {
  const traceDirectory = join(testCacheDir, 'traces')
  await mkdir(testCacheDir)
  await writeFile(traceDirectory, 'not a directory')

  await expect(ElectronContentTracing.stopRecording()).rejects.toMatchObject({ code: 'EEXIST' })
  expect(electron.contentTracing.stopRecording).not.toHaveBeenCalled()
})

test('stopRecording - Electron error', async () => {
  // @ts-expect-error
  electron.contentTracing.stopRecording.mockImplementation(async () => {
    throw new TypeError('trace write failed')
  })

  await expect(ElectronContentTracing.stopRecording()).rejects.toThrow(new TypeError('trace write failed'))
})
