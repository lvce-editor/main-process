import { build } from 'esbuild'
import electron from 'electron'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'lvce-window-state-'))
try {
  const outfile = join(directory, 'test.mjs')
  await build({ bundle: true, entryPoints: ['scripts/fixtures/window-state.ts'], external: ['electron'], format: 'esm', outfile, platform: 'node' })
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  for (const kind of ['CONFIG', 'DATA', 'CACHE', 'STATE']) env[`XDG_${kind}_HOME`] = join(directory, kind.toLowerCase())
  for (const mode of ['verify-missing', 'save-normal', 'verify-normal', 'save-maximized', 'verify-maximized']) {
    const result = spawnSync(electron, ['--no-sandbox', `--user-data-dir=${join(directory, 'profile')}`, outfile, mode], {
      env,
      stdio: 'inherit',
      timeout: 30_000,
    })
    assert.equal(result.error, undefined, `${result.error}`)
    assert.equal(result.status, 0)
  }
} finally {
  await rm(directory, { force: true, recursive: true })
}
