import { afterEach, expect, jest, test } from '@jest/globals'
import * as Process from '../src/parts/Process/Process.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

test('writeStdout', () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  Process.writeStdout('Done\n')
  expect(write).toHaveBeenCalledWith('Done\n')
})

test('writeStderr', () => {
  const write = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
  Process.writeStderr('Failed\n')
  expect(write).toHaveBeenCalledWith('Failed\n')
})
