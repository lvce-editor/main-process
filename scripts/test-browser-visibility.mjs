import { build } from 'esbuild'
import electron from 'electron'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'lvce-browser-visibility-'))
try {
  const outfile = join(directory, 'test.mjs')
  await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/browser-visibility.ts'],
    external: ['electron'],
    format: 'esm',
    outfile,
    platform: 'node',
  })
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  for (const name of ['CONFIG', 'DATA', 'STATE', 'CACHE']) {
    env[`XDG_${name}_HOME`] = join(directory, name.toLowerCase())
  }
  const result = spawnSync(electron, [outfile, '--no-sandbox', `--user-data-dir=${directory}/profile`], { env, stdio: 'inherit', timeout: 60_000 })
  if (result.error) {
    throw result.error
  }
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { force: true, recursive: true })
}
