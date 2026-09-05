import { build } from 'esbuild'
import electron from 'electron'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'lvce-auth-popup-'))
try {
  const outfile = join(directory, 'test.mjs')
  await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/auth-popup.ts'],
    external: ['electron'],
    format: 'esm',
    outfile,
    platform: 'node',
  })
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const result = spawnSync(electron, [outfile, '--no-sandbox', `--user-data-dir=${directory}/profile`], { env, stdio: 'inherit', timeout: 30_000 })
  if (result.error) {
    throw result.error
  }
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { force: true, recursive: true })
}
