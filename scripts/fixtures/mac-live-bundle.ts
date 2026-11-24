import { app, BrowserWindow, net, protocol } from 'electron'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { applyUpdate } from '../../packages/main-process/src/parts/MacUpdate/MacUpdate.ts'

// Deliberately a packaging probe, not the LVCE updater or a production hot-reload implementation.
const root = process.env.LVCE_LIVE_BUNDLE_ROOT!
const mode = process.env.LVCE_LIVE_BUNDLE_MODE!
const bootVersion = JSON.parse(readFileSync(join(app.getAppPath(), 'package.json'), 'utf8')).version
const bootPid = process.pid
const resourcePath = process.resourcesPath
protocol.registerSchemesAsPrivileged([{ scheme: 'probe', privileges: { standard: true, secure: true, supportFetchAPI: true } }])
const windows: BrowserWindow[] = []

const observe = (window: BrowserWindow) =>
  window.webContents.executeJavaScript(`(async () => {
    const config = await (await fetch('probe://app/config.json', {cache: 'no-store'})).json()
    const workerVersion = await new Promise((resolve, reject) => {
      const worker = new Worker('probe://app' + config.workerUrl)
      const timer = setTimeout(() => {worker.terminate(); reject(new Error('worker timeout'))}, 10000)
      worker.onmessage = ({data}) => {clearTimeout(timer); worker.terminate(); resolve(data)}
      worker.onerror = () => {clearTimeout(timer); worker.terminate(); reject(new Error('worker failed'))}
    })
    return {configVersion: config.version, workerVersion, draft: document.querySelector('#draft').value, pageIdentity}
  })()`)

const run = async (): Promise<void> => {
  await app.whenReady()
  protocol.handle('probe', (request) => net.fetch(pathToFileURL(join(resourcePath, 'app/assets', new URL(request.url).pathname)).href))
  for (let index = 0; index < 2; index++) {
    const window = new BrowserWindow({ show: false, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false } })
    windows.push(window)
    await window.loadURL('probe://app/index.html')
  }
  const initial = await Promise.all(windows.map(observe))
  for (const observation of initial) assert.equal(observation.workerVersion, mode === 'live' ? 1 : 3)
  const generations: unknown[] = []
  if (mode === 'live') {
    for (const version of [2, 3]) {
      applyUpdate({
        appPath: join(root, 'Installed.app'),
        backupPath: join(root, `Previous${version - 1}.app`),
        stagedPath: join(root, `Next${version}.app`),
        version: `1.0.${version}`,
      })
      const observations = await Promise.all(windows.map(observe))
      for (const [index, observation] of observations.entries()) {
        assert.equal(observation.workerVersion, version)
        assert.equal(observation.configVersion, version)
        assert.equal(observation.draft, 'unsaved draft')
        assert.equal(observation.pageIdentity, initial[index].pageIdentity, 'renderer page must survive')
      }
      assert.equal(process.pid, bootPid)
      assert.equal(process.resourcesPath, resourcePath)
      assert.equal(bootVersion, '1.0.1', 'main process retains its startup version')
      generations.push({ version, observations, pid: process.pid, bootVersion, runtimeVersion: app.getVersion() })
    }
  }
  await writeFile(
    join(root, `${mode}.json`),
    JSON.stringify({ bootVersion, pid: process.pid, electron: process.versions.electron, resourcePath, initial, generations }),
  )
}

run().then(
  () => {
    for (const window of windows) window.destroy()
    app.exit(0)
  },
  (error) => {
    console.error(error)
    for (const window of windows) window.destroy()
    app.exit(1)
  },
)
