import { app, BrowserWindow, WebContentsView } from 'electron'
import assert from 'node:assert/strict'
import * as BrowserViews from '../../packages/main-process/src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts'
import * as BrowserViewState from '../../packages/main-process/src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const waitForFrame = async (view: WebContentsView): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      view.webContents.executeJavaScript(`new Promise(resolve => {
        const check = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', check)
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          }
        }
        document.addEventListener('visibilitychange', check)
        check()
      })`),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('The attached browser page did not resume visible frames')), 5000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

const main = async (): Promise<void> => {
  await app.whenReady()
  const window = new BrowserWindow({ height: 700, width: 1000 })
  await window.loadURL('data:text/html,<body style="background:%23223344"><img id="snapshot" style="position:absolute;left:400px;top:100px">')
  const views = [new WebContentsView(), new WebContentsView()]
  for (const [index, view] of views.entries()) {
    window.contentView.addChildView(view)
    view.setBounds({ height: 500, width: 550, x: 400, y: 100 })
    BrowserViewState.add(view.webContents.id, window, view)
    await view.webContents.loadURL(
      `data:text/html,<body style="background:rgb(40,94,168)"><h1>Article ${index}</h1><input value="unsaved draft"><script>window.token=crypto.randomUUID()</script>`,
    )
    await waitForFrame(view)
    BrowserViews.hide(view.webContents.id)
  }
  const tokens = await Promise.all(views.map((view) => view.webContents.executeJavaScript('window.token')))
  for (let cycle = 0; cycle < 20; cycle++) {
    const view = views[cycle % views.length]
    BrowserViews.show(view.webContents.id)
    await waitForFrame(view)
    const image = await view.webContents.capturePage()
    assert.equal(image.isEmpty(), false)
    await window.webContents.executeJavaScript(`document.querySelector('#snapshot').src = ${JSON.stringify(image.toDataURL())}`)
    BrowserViews.hide(view.webContents.id)
    assert.equal(view.getVisible(), false)
    BrowserViews.show(view.webContents.id)
    await window.webContents.executeJavaScript("document.querySelector('#snapshot').removeAttribute('src')")
    await waitForFrame(view)
    assert.equal(await view.webContents.executeJavaScript('window.token'), tokens[cycle % views.length])
    assert.equal(await view.webContents.executeJavaScript('document.querySelector("input").value'), 'unsaved draft')
    assert.deepEqual(view.getBounds(), { height: 500, width: 550, x: 400, y: 100 })
    BrowserViews.hide(view.webContents.id)
  }
  for (const view of views) {
    BrowserViewState.remove(view.webContents.id)
    window.contentView.removeChildView(view)
    view.webContents.close()
  }
  assert.equal(window.contentView.children.length, 0)
  window.destroy()
  console.log('PASS: browser pages resume visible frames after overlays and tab switches without losing drafts')
}

main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
