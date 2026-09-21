import { app, BrowserWindow, WebContentsView } from 'electron'
import assert from 'node:assert/strict'
import { createWebContentsView } from '../../packages/main-process/src/parts/ElectronWebContentsView/ElectronWebContentsView.ts'
import * as BrowserViewState from '../../packages/main-process/src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const window = new BrowserWindow({ height: 700, width: 1000 })
  const otherWindow = new BrowserWindow({ show: false })
  await window.loadURL('data:text/html,<script>window.token=crypto.randomUUID()</script>')
  const rendererToken = await window.webContents.executeJavaScript('window.token')
  const view = new WebContentsView()
  window.contentView.addChildView(view)
  const bounds = { height: 500, width: 800, x: 0, y: 100 }
  view.setBounds(bounds)
  BrowserViewState.add(view.webContents.id, window, view)
  await view.webContents.loadURL('data:text/html,<input value="unsaved draft"><script>window.token=crypto.randomUUID()</script>')
  const pageToken = await view.webContents.executeJavaScript('window.token')
  // A running media clock must survive reattachment, including while the page
  // remains visible. Zero gain keeps this regression test silent on desktops.
  await view.webContents.executeJavaScript(
    `(async () => {
    window.audio = new AudioContext()
    const source = audio.createOscillator()
    const gain = audio.createGain()
    gain.gain.value = 0
    source.connect(gain).connect(audio.destination)
    source.start()
    await audio.resume()
  })()`,
    true,
  )
  const audioTime = await view.webContents.executeJavaScript('audio.currentTime')
  for (let cycle = 0; cycle < 10; cycle++) {
    assert.equal(await createWebContentsView(view.webContents.id, window.id), view.webContents.id)
    await view.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
    assert.equal(await view.webContents.executeJavaScript('window.token'), pageToken)
    assert.equal(await view.webContents.executeJavaScript('document.querySelector("input").value'), 'unsaved draft')
    assert.equal(await view.webContents.executeJavaScript('document.visibilityState'), 'visible')
    assert.equal(await view.webContents.executeJavaScript('audio.state'), 'running')
    assert.equal(view.getVisible(), true)
    assert.deepEqual(view.getBounds(), bounds)
    assert.deepEqual(window.contentView.children, [view])
    assert.equal(BrowserViewState.get(view.webContents.id).browserWindow, window)
  }
  assert.ok(await view.webContents.executeJavaScript(`audio.currentTime > ${audioTime}`))
  assert.equal(await window.webContents.executeJavaScript('window.token'), rendererToken)
  await assert.rejects(createWebContentsView(view.webContents.id, otherWindow.id), /another window/)
  assert.deepEqual(window.contentView.children, [view])
  await view.webContents.executeJavaScript('audio.close()')
  BrowserViewState.remove(view.webContents.id)
  window.contentView.removeChildView(view)
  view.webContents.close()
  otherWindow.destroy()
  window.destroy()
  console.log('PASS: repeated native-view restoration preserves owner, page, draft, visibility and media clock')
}

main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
