import { app, BrowserWindow, protocol, session } from 'electron'
import assert from 'node:assert/strict'
import { openAsBlob } from 'node:fs'
import { join } from 'node:path'
import { getFontResponseHeaders } from '../../packages/main-process/src/parts/GetFontResponseHeaders/GetFontResponseHeaders.ts'
import * as Platform from '../../packages/main-process/src/parts/Platform/Platform.ts'
import * as Protocol from '../../packages/main-process/src/parts/Protocol/Protocol.ts'
import { registerFontSource } from '../../packages/main-process/src/parts/RegisterFontSource/RegisterFontSource.ts'
import * as Root from '../../packages/main-process/src/parts/Root/Root.ts'

Protocol.enable(protocol)

const main = async (): Promise<void> => {
  await app.whenReady()
  const fontPath = '/commit/fonts/FiraCode-VariableFont.ttf'
  const origin = `${Platform.scheme}://-`
  const fontHeaders = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': 'font/ttf',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    Etag: 'test-font',
  }
  const config = { files: { [fontPath]: 0 }, headers: [fontHeaders] }
  const ses = session.fromPartition('font-source-test', { cache: false })
  const untouchedSession = session.fromPartition('font-source-other')
  assert.equal(registerFontSource(ses, { files: {}, headers: [] }, Root.root), false)
  assert.equal(registerFontSource(ses, config, Root.root), true)
  assert.equal(untouchedSession.protocol.getSource(Platform.fontScheme), null)
  const handled: string[] = []
  ses.protocol.handle(Platform.scheme, async (request) => {
    handled.push(request.url)
    if (new URL(request.url).pathname === fontPath) {
      return new Response(await openAsBlob(join(Root.root, 'static', fontPath)), { headers: fontHeaders })
    }
    if (request.url.endsWith('/worker.js')) {
      return new Response(
        `new FontFace('WorkerFont', 'url(${origin}${fontPath})').load().then(font => postMessage(font.status)).catch(error => postMessage(String(error)))`,
        { headers: { 'Content-Type': 'text/javascript', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
      )
    }
    if (request.url !== `${origin}/`) {
      return new Response('missing', { status: 404 })
    }
    return new Response('<html><body>Bundled font</body></html>', {
      headers: {
        'Content-Type': 'text/html',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; worker-src 'self'; connect-src 'self'; font-src 'self'",
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    })
  })
  ses.webRequest.onHeadersReceived({ urls: [`${origin}/`, `${origin}/?*`, `${origin}/*.html*`] }, (details, callback) => {
    callback({ responseHeaders: getFontResponseHeaders(details.responseHeaders) })
  })
  const window = new BrowserWindow({ show: false, webPreferences: { session: ses } })
  try {
    await window.loadURL(`${origin}/`)
    assert.equal(await window.webContents.executeJavaScript('crossOriginIsolated'), true)
    const loaded = await window.webContents.executeJavaScript(`new FontFace('NativeFont', 'url(${fontPath})').load().then(font => font.status)`)
    assert.equal(loaded, 'loaded')
    assert.equal(handled.includes(`${origin}${fontPath}`), false, 'window font loads must bypass the JavaScript handler')
    const response = await window.webContents.executeJavaScript(`fetch(${JSON.stringify(fontPath)}).then(async response => ({
      status: response.status, policy: response.headers.get('cross-origin-resource-policy'), size: (await response.arrayBuffer()).byteLength
    }))`)
    assert.equal(response.status, 200)
    assert.equal(response.policy, 'same-origin', 'ordinary fetches keep their original headers')
    assert.ok(response.size > 0)
    assert.ok(handled.includes(`${origin}${fontPath}`))
    assert.equal(await window.webContents.executeJavaScript("fetch('/missing.ttf').then(response => response.status)"), 404)
    const workerResult = await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
      const worker = new Worker('/worker.js');
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('worker timeout')); }, 5000);
      worker.onmessage = event => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
      worker.onerror = event => { clearTimeout(timer); worker.terminate(); reject(new Error(event.message)); };
    })`)
    assert.equal(workerResult, 'loaded', 'worker font requests must still load through the existing handler')
    const nativeResponse = await ses.fetch(`${Platform.fontScheme}://-/fonts/FiraCode-VariableFont.ttf`)
    assert.equal(nativeResponse.headers.get('content-type'), 'font/ttf')
    assert.equal(nativeResponse.headers.get('etag'), 'test-font')
    assert.equal(nativeResponse.headers.get('cross-origin-embedder-policy'), 'require-corp')
    assert.equal(nativeResponse.headers.get('access-control-allow-origin'), origin)
    assert.equal((await nativeResponse.arrayBuffer()).byteLength, response.size)
    const head = await ses.fetch(`${Platform.fontScheme}://-/fonts/FiraCode-VariableFont.ttf`, { method: 'HEAD' })
    assert.equal((await head.arrayBuffer()).byteLength, 0)
    await assert.rejects(ses.fetch(`${Platform.fontScheme}://-/fonts/missing.ttf`))
    assert.equal(await window.webContents.executeJavaScript('crossOriginIsolated'), true)
  } finally {
    window.destroy()
  }
}

void main()
  .then(() => {
    console.log('Native bundled font, fetch, worker, headers, session isolation, and missing-resource checks passed')
    app.quit()
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })
