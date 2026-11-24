import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import electron from 'electron'
import { build } from 'esbuild'

if (process.platform !== 'darwin') throw new Error('This packaged-app probe requires macOS')
const root = await realpath(await mkdtemp(join(tmpdir(), 'lvce-live-bundle-')))
try {
  const bundle = join(dirname(electron), '../..')
  const built = await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/mac-live-bundle.ts'],
    external: ['electron'],
    format: 'esm',
    platform: 'node',
    write: false,
  })
  const main = built.outputFiles[0].text
  const hashes = []
  for (let version = 1; version <= 3; version++) {
    const path = join(root, version === 1 ? 'Installed.app' : `Next${version}.app`)
    execFileSync('/usr/bin/ditto', [bundle, path])
    await rm(join(path, 'Contents/Resources/default_app.asar'), { force: true })
    const app = join(path, 'Contents/Resources/app')
    await mkdir(join(app, 'assets'), { recursive: true })
    await writeFile(join(app, 'package.json'), JSON.stringify({ name: 'lvce-live-bundle-probe', version: `1.0.${version}`, main: 'main.mjs' }))
    await writeFile(join(app, 'main.mjs'), main)
    await writeFile(join(app, 'assets/config.json'), JSON.stringify({ workerUrl: `/worker-${version}.js`, version }))
    await writeFile(join(app, `assets/worker-${version}.js`), `postMessage(${version})`)
    await writeFile(
      join(app, 'assets/index.html'),
      '<!doctype html><input id="draft" value="unsaved draft"><script>globalThis.pageIdentity = Math.random()</script>',
    )
    execFileSync('/usr/libexec/PlistBuddy', ['-c', `Set :CFBundleShortVersionString 1.0.${version}`, join(path, 'Contents/Info.plist')])
    execFileSync('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', path])
    execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', path])
    hashes.push(
      createHash('sha256')
        .update(await readFile(join(app, 'main.mjs')))
        .digest('hex'),
    )
  }
  assert.equal(new Set(hashes).size, 1, 'surviving main code must be identical')
  const env = { ...process.env, LVCE_LIVE_BUNDLE_ROOT: root }
  delete env.ELECTRON_RUN_AS_NODE
  for (const name of ['CONFIG', 'DATA', 'CACHE', 'STATE']) env[`XDG_${name}_HOME`] = join(root, name.toLowerCase())
  for (const mode of ['live', 'cold']) {
    const result = spawnSync(join(root, 'Installed.app/Contents/MacOS/Electron'), [`--user-data-dir=${root}/profile`], {
      env: { ...env, LVCE_LIVE_BUNDLE_MODE: mode },
      encoding: 'utf8',
      timeout: 120_000,
    })
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.error) throw result.error
    assert.equal(result.status, 0, `${mode} process failed`)
    const evidence = JSON.parse(await readFile(join(root, `${mode}.json`), 'utf8'))
    console.log(JSON.stringify({ mode, mainSha256: hashes[0], ...evidence }))
    assert.equal(evidence.bootVersion, mode === 'live' ? '1.0.1' : '1.0.3')
  }
} finally {
  await rm(root, { recursive: true, force: true })
}
