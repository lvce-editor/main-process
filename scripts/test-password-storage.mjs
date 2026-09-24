import { build } from 'esbuild'
import electron from 'electron'
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: 'inherit', timeout: 60_000, ...options })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`)
}

if (process.argv[2] === '--child') {
  const directory = process.argv[3]
  run('gnome-keyring-daemon', ['--unlock', '--components=secrets'], { input: 'isolated-test-keyring', stdio: ['pipe', 'ignore', 'inherit'] })
  for (const phase of ['save', 'restart', 'unavailable']) {
    run(electron, [
      join(directory, 'test.mjs'),
      '--no-sandbox',
      `--user-data-dir=${directory}/profile`,
      `--password-store=${phase === 'unavailable' ? 'basic' : 'gnome-libsecret'}`,
      phase,
    ])
  }
} else {
  const directory = await mkdtemp(join(tmpdir(), 'lvce-password-storage-'))
  try {
    await build({
      bundle: true,
      entryPoints: ['scripts/fixtures/password-storage.ts'],
      external: ['electron'],
      format: 'esm',
      outfile: join(directory, 'test.mjs'),
      platform: 'node',
    })
    const env = { ...process.env }
    delete env.ELECTRON_RUN_AS_NODE
    for (const name of ['CONFIG', 'DATA', 'STATE', 'CACHE']) env[`XDG_${name}_HOME`] = join(directory, name.toLowerCase())
    run('dbus-run-session', ['--', process.execPath, import.meta.filename, '--child', directory], { env })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
