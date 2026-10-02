import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import electron from 'electron'

const directory = await mkdtemp(join(tmpdir(), 'lvce-cpu-test-'))
const outputs = []
try {
  const outfile = join(directory, 'test.cjs')
  const utility = join(directory, 'utility.cjs')
  await writeFile(
    utility,
    `function utilityBusy(){const end=performance.now()+200;while(performance.now()<end){Math.sqrt(Math.random())}};utilityBusy();process.parentPort.postMessage('ready');setInterval(()=>{},1000);`,
  )
  await build({
    bundle: true,
    entryPoints: ['scripts/fixtures/startup-cpu-profile.ts'],
    external: ['electron'],
    format: 'cjs',
    outfile,
    platform: 'node',
  })
  for (const mode of ['configured', 'default', 'failure']) {
    const env = { ...process.env, PROFILE_UTILITY: utility }
    delete env.ELECTRON_RUN_AS_NODE
    delete env.PROFILE_OUTPUT
    delete env.PROFILE_FAILURE
    if (mode !== 'default') env.PROFILE_OUTPUT = directory
    if (mode === 'failure') env.PROFILE_FAILURE = 'diagnostic provider unavailable'
    for (const name of ['CONFIG', 'DATA', 'STATE', 'CACHE']) env[`XDG_${name}_HOME`] = join(directory, mode, name.toLowerCase())
    const result = spawnSync(electron, [outfile, '--no-sandbox', `--user-data-dir=${directory}/${mode}/chromium`], {
      encoding: 'utf8',
      env,
      timeout: 45_000,
    })
    assert.ifError(result.error)
    assert.equal(result.status, mode === 'failure' ? 1 : 0, result.stderr)
    const output = result.stdout.match(/CPU profile: (.+)/)?.[1]
    assert.ok(output, result.stdout + result.stderr)
    outputs.push(output)
    const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'))
    assert.deepEqual(manifest.errors, mode === 'failure' ? ['diagnostic provider unavailable'] : [])
    const trace = JSON.parse(await readFile(join(output, manifest.trace), 'utf8'))
    const names = new Set(
      trace.traceEvents.flatMap((event) => (event.args?.data?.cpuProfile?.nodes || []).map((node) => node.callFrame.functionName)),
    )
    for (const name of ['mainBusy', 'rendererBusy', 'workerBusy']) assert.ok(names.has(name), `Missing sampled function ${name}`)
    assert.equal(manifest.utilities.length, 1)
    const profile = JSON.parse(await readFile(join(output, manifest.utilities[0].file), 'utf8'))
    const busyNodes = new Set(profile.nodes.filter((node) => node.callFrame.functionName === 'utilityBusy').map((node) => node.id))
    assert.ok(
      profile.samples.some((sample) => busyNodes.has(sample)),
      'Missing utility CPU samples',
    )
  }
  assert.equal(new Set(outputs).size, 3)
  console.log('Startup CPU profiles capture all four target categories, flush on failure, and use distinct output directories.')
} finally {
  for (const output of outputs) await rm(output, { force: true, recursive: true })
  await rm(directory, { force: true, recursive: true })
}
