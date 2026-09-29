import { app, BrowserWindow, screen } from 'electron'
import { createWindowCloseHandler } from '../../packages/main-process/src/parts/CreateWindowCloseHandler/CreateWindowCloseHandler.ts'
import * as GetRestoredWindowOptions from '../../packages/main-process/src/parts/WindowState/GetRestoredWindowOptions.ts'
import * as WindowState from '../../packages/main-process/src/parts/WindowState/WindowState.ts'
import { showWindowWhenLoaded } from '../../packages/main-process/src/parts/ShowWindowWhenLoaded/ShowWindowWhenLoaded.ts'

const mode = process.argv.at(-1)

const wait = (duration: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

const loadAndShow = async (window: BrowserWindow, onShow?: () => void): Promise<void> => {
  const shown = new Promise<void>((resolve) => window.once('show', resolve))
  showWindowWhenLoaded(window, onShow)
  await window.loadURL('data:text/html,<title>window-state-test</title>')
  await shown
}

const closeAndPersist = async (window: BrowserWindow, windowStateTracker: ReturnType<typeof WindowState.trackWindowState>): Promise<void> => {
  const closed = new Promise<void>((resolve) => window.once('closed', resolve))
  const handleWindowClose = createWindowCloseHandler(
    window,
    { invoke: async () => {} },
    (error) => {
      throw error
    },
    () => windowStateTracker.dispose(),
    async () => {
      await WindowState.writeWindowState(windowStateTracker.getState())
    },
  )
  window.on('close', handleWindowClose)
  window.close()
  await closed
}

const run = async (): Promise<void> => {
  await app.whenReady()
  if (mode === 'verify-missing') {
    const saved = await WindowState.readWindowState()
    if (saved !== undefined) {
      throw new Error(`Expected missing cache state, got ${JSON.stringify(saved)}`)
    }
    const window = new BrowserWindow({ height: 600, show: false, width: 800 })
    await loadAndShow(window)
    if (window.getBounds().height !== 600 || window.getBounds().width !== 800) {
      throw new Error('Expected startup defaults when cached state is missing')
    }
    app.quit()
    return
  }
  if (mode === 'save-normal') {
    const window = new BrowserWindow({ height: 700, show: false, width: 900 })
    const windowStateTracker = WindowState.trackWindowState(window)
    await loadAndShow(window)
    await wait(100)
    await closeAndPersist(window, windowStateTracker)
  } else if (mode === 'save-maximized') {
    const window = new BrowserWindow({ height: 700, show: false, width: 900 })
    const windowStateTracker = WindowState.trackWindowState(window)
    await loadAndShow(window)
    window.maximize()
    await wait(100)
    await closeAndPersist(window, windowStateTracker)
  } else if (mode === 'verify-normal') {
    const saved = await WindowState.readWindowState()
    if (saved?.height !== 700 || saved.width !== 900 || saved.maximized) {
      throw new Error(`Unexpected normal window state: ${JSON.stringify(saved)}`)
    }
    const window = new BrowserWindow({
      ...GetRestoredWindowOptions.getRestoredWindowOptions(saved, screen.getPrimaryDisplay().workAreaSize),
      show: false,
    })
    const windowStateTracker = WindowState.trackWindowState(window)
    await loadAndShow(window)
    const { height, width } = window.getBounds()
    if (height !== 700 || width !== 900) {
      throw new Error(`Unexpected restored bounds: ${JSON.stringify({ height, width })}`)
    }
    await closeAndPersist(window, windowStateTracker)
  } else if (mode === 'verify-maximized') {
    const saved = await WindowState.readWindowState()
    if (saved?.height !== 700 || saved.width !== 900 || !saved.maximized) {
      throw new Error(`Unexpected maximized window state: ${JSON.stringify(saved)}`)
    }
    const window = new BrowserWindow({
      ...GetRestoredWindowOptions.getRestoredWindowOptions(saved, screen.getPrimaryDisplay().workAreaSize),
      show: false,
    })
    const windowStateTracker = WindowState.trackWindowState(window)
    await loadAndShow(window, () => window.maximize())
    await wait(100)
    if (!window.isMaximized()) {
      throw new Error('Expected restored window to be maximized')
    }
    await closeAndPersist(window, windowStateTracker)
  } else {
    throw new Error(`Unknown window state test mode: ${mode}`)
  }
  app.quit()
}

void run().catch((error: unknown) => {
  console.error(error)
  app.exit(1)
})
