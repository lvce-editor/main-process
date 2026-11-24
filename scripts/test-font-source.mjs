import { build } from 'esbuild'
import electron from 'electron'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'lvce-font-source-'))
try {
  const fontDirectory = join(directory, 'static', 'commit', 'fonts')
  await mkdir(fontDirectory, { recursive: true })
  await copyFile('scripts/fixtures/FiraCode-VariableFont.ttf', join(fontDirectory, 'FiraCode-VariableFont.ttf'))
  const outfile = join(directory, 'test.mjs')
  await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/font-source.ts'],
    external: ['electron'],
    format: 'esm',
    outfile,
    platform: 'node',
  })
  const env = { ...process.env, LVCE_ROOT: directory }
  delete env.ELECTRON_RUN_AS_NODE
  for (const name of ['CONFIG', 'DATA', 'STATE', 'CACHE']) {
    env[`XDG_${name}_HOME`] = join(directory, name.toLowerCase())
  }
  const result = spawnSync(electron, [outfile, '--no-sandbox', '--disable-gpu', `--user-data-dir=${directory}/profile`], {
    env,
    stdio: 'inherit',
    timeout: 60_000,
  })
  if (result.error) {
    throw result.error
  }
  process.exitCode = result.status ?? 1
} finally {
  await rm(directory, { force: true, recursive: true })
}
