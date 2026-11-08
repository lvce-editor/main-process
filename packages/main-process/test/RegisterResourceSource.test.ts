import { expect, test } from '@jest/globals'
import { join } from 'node:path'
import * as Platform from '../src/parts/Platform/Platform.ts'
import * as RegisterResourceSource from '../src/parts/RegisterResourceSource/RegisterResourceSource.ts'

test('registerResourceSource - allows the application origin to load native resources', () => {
  const calls: unknown[] = []
  const session = {
    protocol: {
      registerSource: (...args: unknown[]) => {
        calls.push(args)
      },
    },
  } as unknown as Electron.Session
  RegisterResourceSource.registerResourceSource(session, { files: {}, headers: [] }, '/app', async () => new Response())
  expect(calls).toEqual([
    [
      Platform.resourceScheme,
      {
        routes: [
          {
            source: {
              headers: { 'Access-Control-Allow-Origin': `${Platform.scheme}://-` },
              root: join('/app', 'static'),
              type: 'directory',
            },
          },
        ],
      },
    ],
  ])
})
