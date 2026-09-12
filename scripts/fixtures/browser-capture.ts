import { app, BrowserWindow, nativeImage, WebContentsView } from 'electron'
import assert from 'node:assert/strict'
import * as ElectronWebContentsViewFunctions from '../../packages/main-process/src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts'

const main = async () => {
  await app.whenReady()
  const window = new BrowserWindow({ height: 500, width: 700 })
  const view = new WebContentsView()
  const bounds = { height: 400, width: 600, x: 0, y: 0 }
  window.contentView.addChildView(view)
  view.setBounds(bounds)
  await view.webContents.loadURL(
    'data:text/html,<body style="background:rgb(40,94,168)"><input value="keep this draft"><script>window.token=crypto.randomUUID()</script>',
  )
  await view.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  const token = await view.webContents.executeJavaScript('window.token')
  const originalCapture = view.webContents.capturePage.bind(view.webContents)
  let captures = 0
  // Electron returns an empty image before a view has a render surface.
  const unloaded = new WebContentsView()
  const emptyImage = await unloaded.webContents.capturePage()
  unloaded.webContents.close()
  assert.ok(emptyImage.isEmpty())
  view.webContents.capturePage = async () => (++captures === 1 ? emptyImage : originalCapture())
  const png = await ElectronWebContentsViewFunctions.capturePage(view)
  assert.ok(png.byteLength > 0, 'an empty surface must not become a blank overlay')
  assert.equal(nativeImage.createFromBuffer(Buffer.from(png)).isEmpty(), false)
  assert.equal(captures, 2)
  captures = 0
  // Replay the exact compositor rejection from the Ubuntu 26.04 / Electron 44 report.
  view.webContents.capturePage = async () => {
    if (++captures === 1) throw new Error('UnknownVizError')
    return originalCapture()
  }
  const recovered = await ElectronWebContentsViewFunctions.capturePage(view)
  assert.equal(nativeImage.createFromBuffer(Buffer.from(recovered)).isEmpty(), false)
  assert.equal(captures, 2)
  assert.equal(await view.webContents.executeJavaScript('window.token'), token)
  assert.equal(await view.webContents.executeJavaScript('document.querySelector("input").value'), 'keep this draft')
  assert.ok(window.contentView.children.includes(view))
  assert.ok(view.getVisible())
  console.log('PASS: empty surfaces and UnknownVizError recover without reloading or detaching the page')
  view.webContents.close()
  window.destroy()
}

main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
