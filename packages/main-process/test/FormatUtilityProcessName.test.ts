import { expect, test } from '@jest/globals'
import * as FormatUtilityProcessName from '../src/parts/FormatUtilityProcessName/FormatUtilityProcessName.ts'

test.each([
  ['File System Process', 'file-system-process'],
  ['Extension builtin.remote-ssh: Remote SSH', 'extension-builtin.remote-ssh:-remote-SSH'],
])('formatUtilityProcessName - %s', (name, expected) => {
  expect(FormatUtilityProcessName.formatUtilityProcessName(name)).toBe(expected)
})
