import { app, BrowserWindow } from 'electron'
import assert from 'node:assert/strict'
import { showWindowWhenLoaded } from '../../packages/main-process/src/parts/ShowWindowWhenLoaded/ShowWindowWhenLoaded.ts'

const main = async () => {
  app.on('window-all-closed', () => {})
  await app.whenReady()
  for (let attempt = 0; attempt < 3; attempt++) {
    const window = new BrowserWindow({ backgroundColor: '#222222', show: false })
    showWindowWhenLoaded(window)
    try {
      await window.loadURL('data:text/html,<h1>Window startup</h1>')
      assert.equal(window.isVisible(), true, 'The loaded application window must be visible without relying on ready-to-show')
      console.log(`PASS native window startup ${attempt + 1}`)
    } finally {
      window.destroy()
    }
  }
}

main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
