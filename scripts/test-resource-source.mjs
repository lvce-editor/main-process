import { build } from 'esbuild'
import electron from 'electron'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = await mkdtemp(join(tmpdir(), 'lvce-resource-source-'))
try {
  const staticRoot = join(directory, 'static')
  await mkdir(join(staticRoot, 'commit', 'fonts'), { recursive: true })
  await copyFile('scripts/fixtures/FiraCode-VariableFont.ttf', join(staticRoot, 'commit', 'fonts', 'FiraCode-VariableFont.ttf'))
  const headers = {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; worker-src 'self'; connect-src 'self'; font-src 'self'",
    Etag: 'source-test',
  }
  const files = {
    '/index.html':
      '<html><head><link rel="stylesheet" href="/style.css"></head><body>Resource source acceptance<script src="/script.js"></script></body></html>',
    '/script.js': 'globalThis.scriptLoaded = true',
    '/style.css':
      '@font-face {font-family: Test; src: url(lvce-oss-font://-/fonts/FiraCode-VariableFont.ttf)} body {color: rgb(1, 2, 3); font-family: Test}',
    '/worker.js': "postMessage('static-worker')",
  }
  for (const [path, content] of Object.entries(files)) {
    await writeFile(join(staticRoot, path), content)
  }
  await writeFile(join(directory, 'secret.txt'), 'outside-static')
  await writeFile(join(staticRoot, 'unlisted.txt'), 'unlisted')
  const paths = [...Object.keys(files), '/commit/fonts/FiraCode-VariableFont.ttf', '/missing.js']
  await writeFile(
    join(directory, 'config.json'),
    JSON.stringify({
      files: Object.fromEntries(paths.map((path, index) => [path, index])),
      headers: paths.map((path) => ({
        ...headers,
        'Content-Type': path.endsWith('.js')
          ? 'text/javascript'
          : path.endsWith('.css')
            ? 'text/css'
            : path.endsWith('.ttf')
              ? 'font/ttf'
              : 'text/html',
      })),
    }),
  )
  for (const development of [false, true]) {
    const outfile = join(directory, development ? 'development.mjs' : 'packaged.mjs')
    await build({
      bundle: true,
      entryPoints: ['scripts/fixtures/resource-source.ts'],
      external: ['electron'],
      format: 'esm',
      outfile,
      platform: 'node',
      mainFields: ['module', 'main'],
      plugins: [
        {
          name: 'resource-source-fixture',
          setup(build) {
            build.onLoad({ filter: /Platform\.ts$/ }, async ({ path }) => ({
              contents: (await readFile(path, 'utf8')).replace("JSON.parse('true')", String(development)),
              loader: 'ts',
            }))
            build.onLoad({ filter: /GetElectronFileResponseIpc\.ts$/ }, () => ({
              contents: `
            export const getElectronFileResponseIpc = async (url) => {
              globalThis.ipcRequests.push(url)
              return new Response(url.endsWith('.js') ? "postMessage('remote-worker')" : 'remote-data', {
                headers: {'Content-Type': url.endsWith('.js') ? 'text/javascript' : 'text/plain', 'Cross-Origin-Embedder-Policy': 'require-corp'}
              })
            }`,
              loader: 'ts',
            }))
          },
        },
      ],
    })
    const env = { ...process.env, LVCE_ROOT: directory, TEST_DEVELOPMENT: String(development) }
    delete env.ELECTRON_RUN_AS_NODE
    for (const name of ['CONFIG', 'DATA', 'STATE', 'CACHE']) {
      env[`XDG_${name}_HOME`] = join(directory, name.toLowerCase())
    }
    const result = spawnSync(electron, [outfile, '--no-sandbox', '--disable-gpu', `--user-data-dir=${directory}/profile`], {
      env,
      stdio: 'inherit',
      timeout: 60_000,
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`Resource-source test exited with ${result.status}`)
  }
} finally {
  await rm(directory, { force: true, recursive: true })
}
