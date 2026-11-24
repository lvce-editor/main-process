import { app, BrowserWindow, protocol } from 'electron'
import assert from 'node:assert/strict'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { createElectronSession } from '../../packages/main-process/src/parts/CreateElectronSession/CreateElectronSession.ts'
import * as Platform from '../../packages/main-process/src/parts/Platform/Platform.ts'
import { enable } from '../../packages/main-process/src/parts/Protocol/Protocol.ts'

enable(protocol)
app.on('window-all-closed', () => {})

const main = async (): Promise<void> => {
  await app.whenReady()
  await mkdir(Platform.configDir, { recursive: true })
  for (const setting of [undefined, true, false, 'invalid']) {
    if (setting === undefined) {
      await rm(Platform.getUserSettingsPath(), { force: true })
    } else {
      await writeFile(Platform.getUserSettingsPath(), JSON.stringify({ 'application.useProtocolRegisterSource': setting }))
    }
    process.env.SESSION_ID = `source-test-${setting}`
    const ipcRequests: string[] = []
    Object.assign(globalThis, { ipcRequests })
    const ses = createElectronSession()
    const enabled = setting === true && process.env.TEST_DEVELOPMENT !== 'true'
    assert.equal(Boolean(ses.protocol.getSource(Platform.resourceScheme)), enabled, 'resource source setting')
    assert.equal(Boolean(ses.protocol.getSource(Platform.fontScheme)), enabled, 'font source setting')
    if (process.env.TEST_DEVELOPMENT === 'true') {
      assert.equal(await (await ses.fetch(`${Platform.scheme}://-/script.js`)).text(), "postMessage('remote-worker')")
      assert.equal(ipcRequests.length, 1, 'development retains its IPC loader even with the setting enabled')
      continue
    }
    const nativeRequests: string[] = []
    ses.webRequest.onBeforeRequest({ urls: [`${Platform.resourceScheme}://-/*`] }, (details, callback) => {
      nativeRequests.push(details.url)
      callback({})
    })
    const window = new BrowserWindow({ show: false, webPreferences: { session: ses } })
    try {
      await window.loadURL(`${Platform.scheme}://-/`)
      assert.equal(await window.webContents.executeJavaScript('scriptLoaded'), true)
      assert.equal(await window.webContents.executeJavaScript('getComputedStyle(document.body).color'), 'rgb(1, 2, 3)')
      assert.equal(await window.webContents.executeJavaScript('crossOriginIsolated'), true, 'cross-origin isolation')
      assert.equal(
        await window.webContents.executeJavaScript("document.fonts.ready.then(() => [...document.fonts].every(font => font.status === 'loaded'))"),
        true,
        'CSS font loaded',
      )
      const worker = (path: string) =>
        window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
        const worker = new Worker(${JSON.stringify(path)}, {type: 'module'});
        const timer = setTimeout(() => {worker.terminate(); reject(new Error('worker timeout'))}, 5000);
        worker.onmessage = event => {clearTimeout(timer); worker.terminate(); resolve(event.data)};
        worker.onerror = event => {clearTimeout(timer); worker.terminate(); reject(new Error(event.message))};
      })`)
      assert.equal(await worker('/worker.js'), 'static-worker')
      assert.equal(await worker('/remote/worker.js'), 'remote-worker')
      assert.equal(await window.webContents.executeJavaScript("fetch('/remote/data').then(r => r.text())"), 'remote-data')
      assert.equal(ipcRequests.length, 2, 'only dynamic resources use IPC')
      assert.equal(nativeRequests.length > 0, enabled)
      if (enabled) {
        for (const path of ['/index.html', '/script.js', '/style.css', '/worker.js']) {
          assert.ok(
            nativeRequests.some((url) => new URL(url).pathname === path),
            `${path} uses the native source`,
          )
        }
      }
      const response = await ses.fetch(`${Platform.scheme}://-/script.js?query`)
      assert.match(response.headers.get('content-type') || '', /javascript/)
      assert.equal(response.headers.get('etag'), 'source-test')
      assert.equal(response.headers.get('cross-origin-embedder-policy'), 'require-corp')
      if (enabled) {
        assert.equal((await (await ses.fetch(`${Platform.scheme}://-/script.js`, { method: 'HEAD' })).arrayBuffer()).byteLength, 0)
        assert.equal((await ses.fetch(`${Platform.scheme}://-/missing.js`)).status, 404)
        for (const path of ['/unlisted.txt', '/%2e%2e/secret.txt', '/%2e%2e%2fsecret.txt']) {
          assert.equal((await ses.fetch(`${Platform.scheme}://-${path}`)).status, 404)
        }
        await assert.rejects(ses.fetch(`${Platform.resourceScheme}://-/%2e%2e%2fsecret.txt`))
      }
    } finally {
      window.destroy()
    }
  }
}

void main()
  .then(() => {
    console.log(
      'Resource setting defaults, switching, native HTML/scripts/styles/fonts/workers, remote IPC, headers, missing/traversal, and development checks passed',
    )
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
