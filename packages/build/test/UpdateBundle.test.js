import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { bundleJs } from '../src/bundleJs.js'
import { root } from '../src/root.js'

test('bundled updater retains a working runtime eligibility check', async () => {
  await bundleJs()
  const code = await readFile(join(root, '.tmp/dist/dist/mainProcessMain.js'), 'utf8')
  const start = code.indexOf('const stage = async ')
  const end = code.indexOf('\nconst restart = ', start)
  assert(start !== -1 && end > start, 'bundled update entry points must remain present')
  const calls = []
  const context = {
    app: {
      getPath: () => '/Applications/lvce.app/Contents/MacOS/Electron',
      getAppPath: () => join('/Applications/lvce.app/Contents', 'Resources', 'app'),
      isPackaged: false,
    },
    process: { platform: 'darwin', arch: 'arm64' },
    stageUpdate: async (...args) => calls.push(args),
    pending: undefined,
    staged: undefined,
  }
  const stageCode = code.slice(start, end)
  // Rollup disambiguates imported path functions in the full application bundle.
  for (const name of stageCode.match(/\b(?:dirname|join)(?:\$\d+)?\b/g) || []) {
    context[name] = name.startsWith('dirname') ? dirname : join
  }
  const stage = runInNewContext(`${stageCode}\nstage`, context)
  await stage('/cache/update.dmg', '0.115.19')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['/cache/update.dmg', '0.115.19', '/Applications/lvce.app', 'arm64'])
  context.app.getAppPath = () => '/workspace/main-process'
  await assert.rejects(stage('/cache/update.dmg', '0.115.19'), /installed application build/)
})
