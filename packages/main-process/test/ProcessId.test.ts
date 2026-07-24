import { expect, test } from '@jest/globals'
import * as ProcessId from '../src/parts/ProcessId/ProcessId.ts'
import * as ProcessIdIpc from '../src/parts/ProcessId/ProcessId.ipc.ts'

test('getMainProcessId returns the main process id', () => {
  expect(ProcessId.getMainProcessId()).toBe(process.pid)
})

test('ipc exposes getMainProcessId', () => {
  expect(ProcessIdIpc.name).toBe('ProcessId')
  expect(ProcessIdIpc.Commands.getMainProcessId()).toBe(process.pid)
})
