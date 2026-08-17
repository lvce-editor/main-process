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
