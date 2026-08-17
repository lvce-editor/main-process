import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as ArgvConfig from '../src/parts/ArgvConfig/ArgvConfig.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  const directories = [...temporaryDirectories]
  temporaryDirectories.length = 0
  await Promise.all(directories.map((path) => rm(path, { force: true, recursive: true })))
})

test('parseArgvConfig converts object values into command line arguments', () => {
  expect(
    ArgvConfig.parseArgvConfig(`{
      // Extension development paths can be repeated.
      "link": ["/test/one", "/test/two"],
      "disable-custom-worker-paths": true,
      "sandbox": false,
      "port": 3000
    }`),
  ).toEqual(['--link=/test/one', '--link=/test/two', '--disable-custom-worker-paths', '--port=3000'])
})

test('parseArgvConfig rejects unsupported values', () => {
  expect(() => ArgvConfig.parseArgvConfig('{"link": {"path": "/test"}}')).toThrow(
    new TypeError('Invalid argv.json value for "link": expected a boolean, string, number, or array of strings and numbers'),
  )
})

test('load reads argv.json once per process', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lvce-argv-config-'))
  temporaryDirectories.push(directory)
  const path = join(directory, 'argv.json')
  await writeFile(path, '{"link": "/test/extension"}')
  const env = {}

  await expect(ArgvConfig.load(path, env)).resolves.toEqual(['--link=/test/extension'])
  await expect(ArgvConfig.load(path, env)).resolves.toEqual([])
})

test('load ignores a missing argv.json file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lvce-argv-config-'))
  temporaryDirectories.push(directory)

  await expect(ArgvConfig.load(join(directory, 'missing.json'), {})).resolves.toEqual([])
})
