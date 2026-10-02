import * as Electron from 'electron'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import * as InspectorConnection from './InspectorConnection.ts'
import * as UtilityBootstrap from './UtilityBootstrap.ts'

let directory = ''
let recording = false
let finishing: Promise<void> | undefined
let watchdog: ReturnType<typeof setTimeout> | undefined
let utilityIndex = 0
const utilities: { name: string; file: string; connection: Awaited<ReturnType<typeof InspectorConnection.connect>> }[] = []
const pendingUtilities = new Set<Promise<unknown>>()

export const isEnabled = (): boolean => directory !== ''

export const configure = (args: any): void => {
  if (!args['cpu-profile']) return
  if (typeof args.open !== 'string' || !args.open || args.prompt !== undefined || args.reuse || args['wait-10-seconds']) {
    throw new Error('--cpu-profile requires --open <file> and cannot be combined with prompt, reuse or timed exit')
  }
  const parent = args['cpu-profile-dir'] === undefined ? tmpdir() : resolve(args['cpu-profile-dir'])
  mkdirSync(parent, { recursive: true })
  directory = mkdtempSync(join(parent, 'lvce-cpu-'))
  const userData = join(directory, 'user-data')
  mkdirSync(userData)
  Electron.app.setPath('userData', userData)
  Electron.app.setPath('sessionData', userData)
  Electron.app.on('before-quit', (event) => {
    if (finishing) {
      return
    }

    event.preventDefault()
    void complete('Application closed before diagnostics completed')
  })
  watchdog = setTimeout(() => void complete('CPU profiling timed out waiting for editor readiness'), 60_000)
}

export const start = async (): Promise<void> => {
  if (!isEnabled()) return
  await Electron.contentTracing.startRecording({
    included_categories: ['v8', 'devtools.timeline', 'disabled-by-default-v8.cpu_profiler', 'disabled-by-default-v8.cpu_profiler.hires'],
    recording_mode: 'record-until-full',
  })
  recording = true
}

const waitForEndpoint = async (path: string): Promise<string> => {
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline && !finishing) {
    try {
      return await readFile(path, 'utf8')
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
    await delay(20)
  }
  throw new Error('Utility process did not expose its CPU profiler')
}

export const createUtility = async (options: any, create: (options: any) => Promise<any>): Promise<any> => {
  if (!isEnabled()) return create(options)
  if (finishing) throw new Error('CPU profiling is stopping')
  const index = ++utilityIndex
  const bootstrap = join(directory, `utility-${index}.cjs`)
  const endpoint = join(directory, `utility-${index}.endpoint`)
  writeFileSync(bootstrap, UtilityBootstrap.getBootstrap(options.path, endpoint), { flag: 'wx', mode: 0o600 })
  const creation = create({ ...options, path: bootstrap })
  // Attach a rejection handler immediately while the utility waits for its debugger.
  void creation.catch(() => {})
  const profiling = (async () => {
    const url = await waitForEndpoint(endpoint)
    const connection = await InspectorConnection.connect(url)
    utilities.push({ connection, file: `utility-${index}.cpuprofile`, name: options.name || `utility-${index}` })
    await connection.invoke('Profiler.enable')
    await connection.invoke('Profiler.start')
    await connection.invoke('Runtime.runIfWaitingForDebugger')
    return creation
  })()
  pendingUtilities.add(profiling)
  try {
    return await profiling
  } finally {
    pendingUtilities.delete(profiling)
  }
}

const withTimeout = async <T>(promise: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('CPU profile operation timed out')), 10_000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

const finish = async (failure: string): Promise<void> => {
  clearTimeout(watchdog)
  const errors = failure ? [failure] : []
  try {
    // Utility RPC handshakes must finish before the corresponding profiler is stopped.
    const pending = await Promise.allSettled(Array.from(pendingUtilities, (pending) => withTimeout(pending)))
    for (const result of pending) {
      if (result.status === 'rejected') errors.push(String(result.reason))
    }
    for (const utility of utilities) {
      try {
        const { profile } = await utility.connection.invoke('Profiler.stop')
        writeFileSync(join(directory, utility.file), JSON.stringify(profile), { flag: 'wx' })
      } catch (error) {
        errors.push(`${utility.name}: ${error}`)
      } finally {
        utility.connection.close()
      }
    }
    if (recording) {
      const usage = await Electron.contentTracing.getTraceBufferUsage()
      if (usage.value >= 1) errors.push('CPU trace buffer filled before profiling completed')
      await withTimeout(Electron.contentTracing.stopRecording(join(directory, 'trace.json')))
      recording = false
    }
    writeFileSync(
      join(directory, 'manifest.json'),
      JSON.stringify(
        {
          errors,
          formatVersion: 1,
          trace: 'trace.json',
          traceTargets: ['main', 'renderer', 'web-workers'],
          utilities: utilities.map(({ file, name }) => ({ file, name })),
        },
        null,
        2,
      ),
      { flag: 'wx' },
    )
  } catch (error) {
    errors.push(String(error))
  } finally {
    for (const utility of utilities) utility.connection.close()
    console.log(`CPU profile: ${directory}`)
    if (errors.length > 0) console.error(errors.join('\n'))
    const code = errors.length > 0 ? 1 : 0
    Electron.app.once('will-quit', () => Electron.app.exit(code))
    setTimeout(() => Electron.app.exit(code || 1), 10_000).unref()
    Electron.app.quit()
  }
}

export const complete = (failure = ''): Promise<void> => {
  if (!isEnabled()) throw new Error('CPU profiling is not enabled')
  finishing ??= finish(failure)
  return finishing
}
