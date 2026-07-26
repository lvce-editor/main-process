import { expect, jest, test } from '@jest/globals'
import { addListener, formatMessage } from '../src/parts/WindowLogger/WindowLogger.ts'

test('formatMessage', () => {
  const message = formatMessage({
    frame: undefined as any,
    level: 'error',
    lineNumber: 42,
    message: 'Something went wrong',
    sourceId: 'file:///app/renderer.js',
  })

  expect(message).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[error\] \[Window\] Something went wrong \(file:\/\/\/app\/renderer\.js:42\)$/,
  )
})

test('formatMessage - no source', () => {
  const message = formatMessage({
    frame: undefined as any,
    level: 'info',
    lineNumber: 0,
    message: 'Ready',
    sourceId: '',
  })

  expect(message).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\] \[Window\] Ready$/)
})

test('addListener', () => {
  const listeners: Record<string, (event: any) => void> = Object.create(null)
  const webContents = {
    on: jest.fn((event: string, listener: (event: any) => void) => {
      listeners[event] = listener
    }),
  }
  const logger = {
    log: jest.fn(),
  }

  addListener(webContents as any, logger)
  listeners['console-message']({
    frame: undefined,
    level: 'warning',
    lineNumber: 7,
    message: 'Deprecated API',
    sourceId: 'file:///app/api.js',
  })

  expect(webContents.on).toHaveBeenCalledWith('console-message', expect.any(Function))
  expect(logger.log).toHaveBeenCalledWith(
    expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[warning\] \[Window\] Deprecated API \(file:\/\/\/app\/api\.js:7\)$/),
  )
})
