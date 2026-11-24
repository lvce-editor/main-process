import { build } from 'esbuild'
import electron from 'electron'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const directory = await mkdtemp(join(tmpdir(), 'lvce-update-restart-'))
try {
  const outfile = join(directory, 'test.mjs')
  await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/update-restart.ts'],
    external: ['electron'],
    format: 'esm',
    outfile,
    platform: 'node',
    mainFields: ['module', 'main'],
    plugins: [
      {
        name: 'packaged-protocol',
        setup(build) {
          build.onLoad({ filter: /Platform\.ts$/ }, async ({ path }) => ({
            contents: (await readFile(path, 'utf8')).replace("JSON.parse('true')", 'false'),
            loader: 'ts',
          }))
        },
      },
    ],
  })
  // Generate different hashed lazy modules, as a new packaged build does.
  for (const generation of ['old', 'new']) {
    await build({
      bundle: true,
      splitting: true,
      entryPoints: ['node_modules/@lvce-editor/shared-process/src/sharedProcessMain.js'],
      external: ['electron'],
      format: 'esm',
      outdir: join(directory, generation),
      platform: 'node',
      banner: { js: `// ${generation} package generation` },
    })
  }
  for (const mode of ['restart', 'updated-close', 'normal-close', 'preload-failure']) {
    const root = join(directory, mode)
    await mkdir(join(root, 'static', 'old'), { recursive: true })
    await writeFile(
      join(root, 'static', 'old', 'preload.cjs'),
      `document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.dataset.preload = location.href.includes('lvce-oss:') ? require('node:path').basename(require('node:path').dirname(__filename)) : 'unexpected'
    })`,
    )
    await writeFile(join(root, 'static', 'old', 'app.js'), "globalThis.loadedBuild = 'old'; globalThis.closeAllowed = true")
    await writeFile(join(root, 'static', 'index.html'), '<html><head><script src="/old/app.js"></script></head><body>Editor loaded</body></html>')
    await writeFile(
      join(root, 'config.json'),
      JSON.stringify({
        commit: 'old',
        files: { '/index.html': 0, '/old/app.js': 1 },
        headers: [{ 'Content-Type': 'text/html' }, { 'Content-Type': 'text/javascript' }],
      }),
    )
    await cp(join(directory, 'old'), join(root, 'shared-process'), { recursive: true })
    await cp(join(directory, 'new'), join(root, 'new-shared-process'), { recursive: true })
    await writeFile(join(root, 'package.json'), '{"type":"module"}')
    const env = { ...process.env, LVCE_ROOT: root, LVCE_SHARED_PROCESS_PATH: join(root, 'shared-process', 'sharedProcessMain.js') }
    delete env.ELECTRON_RUN_AS_NODE
    for (const kind of ['CONFIG', 'DATA', 'CACHE', 'STATE']) env[`XDG_${kind}_HOME`] = join(root, kind.toLowerCase())
    let output = ''
    const child = spawn(
      electron,
      [outfile, '--no-sandbox', `--user-data-dir=${join(root, 'profile')}`, '--ipc-type=electron-utility-process', mode],
      {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      },
    )
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('data', (data) => {
        output += data
        process.stderr.write(data)
      })
    }
    let exit
    const exited = new Promise((resolve) =>
      child.once('close', (code, signal) => {
        exit = { code, signal }
        resolve()
      }),
    )
    try {
      let success
      for (let attempt = 0; attempt < 200; attempt++) {
        success = await readFile(join(root, 'success'), 'utf8').catch(() => undefined)
        if (success) break
        if (exit && exit.code !== 0) throw new Error(JSON.stringify(exit))
        await setTimeout(100)
      }
      assert.ok(success, `${mode}: no successful acceptance marker`)
      await Promise.race([
        exited,
        setTimeout(5000).then(() => {
          throw new Error(`${mode}: native Quit did not exit`)
        }),
      ])
      assert.equal(exit.code, 0)
      assert.doesNotMatch(output, /ERR_MODULE_NOT_FOUND|Failed to load command/)
      console.log(`PASS ${mode}: ${success}`)
    } finally {
      const restartedPid = Number(await readFile(join(root, 'pid'), 'utf8').catch(() => 0))
      if (restartedPid && restartedPid !== child.pid) {
        try {
          process.kill(restartedPid, 'SIGTERM')
        } catch (error) {
          if (error.code !== 'ESRCH') throw error
        }
      }
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
  }
} finally {
  await rm(directory, { force: true, recursive: true })
}
