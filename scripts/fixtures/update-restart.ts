import { app, BrowserWindow, protocol } from 'electron'
import assert from 'node:assert/strict'
import { existsSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createElectronSession } from '../../packages/main-process/src/parts/CreateElectronSession/CreateElectronSession.ts'
import { createWindowCloseHandler } from '../../packages/main-process/src/parts/CreateWindowCloseHandler/CreateWindowCloseHandler.ts'
import { executeWindowFunction } from '../../packages/main-process/src/parts/ElectronWindow/ElectronWindow.ts'
import { getOrCreateConfig } from '../../packages/main-process/src/parts/GetOrCreateConfig/GetOrCreateConfig.ts'
import * as Platform from '../../packages/main-process/src/parts/Platform/Platform.ts'
import { enable } from '../../packages/main-process/src/parts/Protocol/Protocol.ts'
import * as RestartApplication from '../../packages/main-process/src/parts/RestartApplication/RestartApplication.ts'
import { root } from '../../packages/main-process/src/parts/Root/Root.ts'
import { trackWindowRenderer } from '../../packages/main-process/src/parts/TrackWindowRenderer/TrackWindowRenderer.ts'

enable(protocol)
app.on('window-all-closed', () => setImmediate(() => app.quit()))
const marker = join(root, 'restarting')
const mode = process.argv.at(-1)

const main = async (): Promise<void> => {
  await app.whenReady()
  writeFileSync(join(root, 'pid'), String(process.pid))
  const restarted = existsSync(marker)
  const commit = restarted ? 'new' : 'old'
  const config = getOrCreateConfig()
  assert.equal(config.commit, commit)
  const preload = join(root, 'static', commit, 'preload.cjs')
  const window = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false, session: createElectronSession() } })
  const isRendererAvailable = trackWindowRenderer(window.webContents, preload)
  const cancelled = Promise.withResolvers<void>()
  let rpcCalls = 0
  const closeHandler = createWindowCloseHandler(
    window,
    {
      invoke: async (method) => {
        rpcCalls++
        if (method === 'Window.canClose') {
          return window.webContents.executeJavaScript('globalThis.closeAllowed')
        }
        await writeFile(join(root, 'saved'), 'saved before relaunch')
      },
    },
    (error) => {
      throw error
    },
    undefined,
    undefined,
    {
      isRendererAvailable,
      onCloseCancelled: () => {
        RestartApplication.cancel()
        cancelled.resolve()
      },
    },
  )
  window.on('close', closeHandler)
  if (mode === 'preload-failure') {
    await rm(preload)
    await window.loadURL(`${Platform.scheme}://-/`)
    assert.equal(isRendererAvailable(), false)
    app.once('will-quit', () => assert.equal(rpcCalls, 0, 'failed preload must not wait for renderer RPC'))
    app.once('will-quit', () => writeFileSync(join(root, 'success'), 'failed-preload Quit passed'))
    app.quit()
    return
  }
  await window.loadURL(`${Platform.scheme}://-/`)
  assert.equal(await window.webContents.executeJavaScript('document.documentElement.dataset.preload'), commit)
  assert.equal(await window.webContents.executeJavaScript('globalThis.loadedBuild'), commit)
  if (restarted) {
    assert.equal(await readFile(join(root, 'saved'), 'utf8'), 'saved before relaunch')
    app.once('will-quit', () => writeFileSync(join(root, 'success'), 'restarted into new preload and assets'))
    app.quit()
    return
  }
  const reloaded = new Promise<void>((resolve) => window.webContents.once('did-finish-load', resolve))
  executeWindowFunction(window.id, 'reload')
  await reloaded
  assert.equal(await window.webContents.executeJavaScript('globalThis.loadedBuild'), 'old')

  // Replace the build and remove its old preload exactly as package installation does.
  await mkdir(join(root, 'static', 'new'), { recursive: true })
  await writeFile(join(root, 'static', 'new', 'preload.cjs'), await readFile(preload, 'utf8'))
  await writeFile(join(root, 'static', 'new', 'app.js'), "globalThis.loadedBuild = 'new'; globalThis.closeAllowed = true")
  const html = await readFile(join(root, 'static', 'index.html'), 'utf8')
  await writeFile(join(root, 'static', 'index.html'), html.replaceAll('/old/', '/new/'))
  const manifest = JSON.parse(await readFile(join(root, 'config.json'), 'utf8'))
  await writeFile(join(root, 'config.json'), JSON.stringify({ ...manifest, commit: 'new', files: { '/index.html': 0, '/new/app.js': 1 } }))
  await rm(join(root, 'static', 'old'), { recursive: true })

  await window.webContents.executeJavaScript('globalThis.closeAllowed = false')
  executeWindowFunction(window.id, 'reload')
  await cancelled.promise
  assert.equal(window.isDestroyed(), false, 'cancel preserves the live editor')
  assert.equal(await window.webContents.executeJavaScript('globalThis.loadedBuild'), 'old')
  assert.equal(existsSync(marker), false)

  await window.webContents.executeJavaScript('globalThis.closeAllowed = true')
  app.once('will-quit', () => {
    // The next process verifies the new preload, assets and previously persisted state.
    writeFileSync(marker, 'ready')
  })
  executeWindowFunction(window.id, 'reload')
}

void main().catch((error: unknown) => {
  console.error(error)
  app.exit(1)
})
