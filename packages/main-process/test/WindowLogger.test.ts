import { expect, jest, test } from '@jest/globals'
import { addListener, formatMessage, getLogFileName } from '../src/parts/WindowLogger/WindowLogger.ts'

test('getLogFileName', () => {
  expect(getLogFileName(42, 123_456_789)).toBe('42/123456789.txt')
})

test('formatMessage', () => {
  const message = formatMessage({
    frame: undefined as any,
    level: 'error',
    lineNumber: 42,
    message: 'Something went wrong',
    sourceId: 'file:///app/renderer.js',
  })

  expect(JSON.parse(message)).toEqual({
    category: 'Window',
    level: 'error',
    line: 42,
    message: 'Something went wrong',
    source: 'file:///app/renderer.js',
    timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  })
})

test('formatMessage - no source', () => {
  const message = formatMessage({
    frame: undefined as any,
    level: 'info',
    lineNumber: 0,
    message: 'Ready',
    sourceId: '',
  })

  expect(JSON.parse(message)).toEqual({
    category: 'Window',
    level: 'info',
    line: 0,
    message: 'Ready',
    source: '',
    timestamp: expect.any(String),
  })
})

test('formatMessage - preserves a multi-line message in one NDJSON record', () => {
  const message = formatMessage({
    frame: undefined as any,
    level: 'warning',
    lineNumber: 7,
    message: 'First line\nSecond line',
    sourceId: 'file:///app/api.js',
  })

  expect(message.split('\n')).toHaveLength(1)
  expect(JSON.parse(message).message).toBe('First line\nSecond line')
})

test('addListener', () => {
  const listeners: Record<string, (event: any) => void> = Object.create(null)
  const webContents = {
    on: jest.fn((event: string, listener: (event: any) => void) => {
      listeners[event] = listener
    }),
  }
  const logger = {
    dispose: jest.fn(),
    log: jest.fn(),
  }

  addListener(42, webContents as any, logger)
  listeners['console-message']({
    frame: undefined,
    level: 'warning',
    lineNumber: 7,
    message: 'Deprecated API',
    sourceId: 'file:///app/api.js',
  })

  expect(webContents.on).toHaveBeenCalledWith('console-message', expect.any(Function))
  expect(webContents.on).toHaveBeenCalledWith('destroyed', expect.any(Function))
  expect(logger.log).toHaveBeenCalledTimes(1)
  expect(JSON.parse(String(logger.log.mock.calls[0][0]))).toEqual({
    category: 'Window',
    level: 'warning',
    line: 7,
    message: 'Deprecated API',
    source: 'file:///app/api.js',
    timestamp: expect.any(String),
  })

  listeners.destroyed(undefined)
  expect(logger.dispose).toHaveBeenCalledTimes(1)
})
