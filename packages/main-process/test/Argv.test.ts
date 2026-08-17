import { expect, test } from '@jest/globals'
import * as Argv from '../src/parts/Argv/Argv.ts'

test('prepend adds config arguments before explicit command line arguments', () => {
  const originalArgv = [...Argv.argv]
  try {
    Argv.argv.splice(0, Argv.argv.length, '/usr/bin/lvce', '--theme=explicit')

    Argv.prepend(['--link=/test/extension', '--theme=configured'])

    expect(Argv.argv).toEqual(['/usr/bin/lvce', '--link=/test/extension', '--theme=configured', '--theme=explicit'])
  } finally {
    Argv.argv.splice(0, Argv.argv.length, ...originalArgv)
  }
})

test('prepend preserves the Electron development application path', () => {
  const originalArgv = [...Argv.argv]
  try {
    Argv.argv.splice(0, Argv.argv.length, '/test/node_modules/electron/dist/electron', '.', '--theme=explicit')

    Argv.prepend(['--link=/test/extension'])

    expect(Argv.argv).toEqual(['/test/node_modules/electron/dist/electron', '.', '--link=/test/extension', '--theme=explicit'])
  } finally {
    Argv.argv.splice(0, Argv.argv.length, ...originalArgv)
  }
})
