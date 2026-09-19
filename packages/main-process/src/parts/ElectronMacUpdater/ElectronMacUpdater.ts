import { app, dialog } from 'electron'
import { dirname, join } from 'node:path'
import type { StagedUpdate } from '../MacUpdate/MacUpdate.ts'
import { applyUpdate, stageUpdate } from '../MacUpdate/MacUpdate.ts'

let staged: StagedUpdate | undefined
let pending: Promise<void> | undefined
let restartRequested = false

export const stage = async (diskImage: string, version: string): Promise<void> => {
  const contentsPath = dirname(dirname(app.getPath('exe')))
  // Official bundles retain Electron's executable name, so app.isPackaged is false.
  // Use runtime paths: build-time production constants can be folded before packaging.
  if (process.platform !== 'darwin' || app.getAppPath() !== join(contentsPath, 'Resources', 'app')) {
    throw new Error('macOS updates require an installed application build')
  }
  if (staged?.version === version) {
    return
  }
  if (pending || staged) {
    throw new Error('An update is already staged or being prepared; restart before installing another update')
  }
  const appPath = dirname(contentsPath)
  pending = (async () => {
    staged = await stageUpdate(diskImage, version, appPath, process.arch)
  })()
  try {
    await pending
  } finally {
    pending = undefined
  }
}

export const restart = (): void => {
  if (!staged) {
    throw new Error('No macOS update is ready to install')
  }
  if (restartRequested) {
    setImmediate(() => app.quit())
    return
  }
  restartRequested = true
  // Wait until normal window shutdown succeeds, so a cancelled close leaves the installed app untouched.
  const update = staged
  const resumeQuit = (): void => {
    setImmediate(() => app.quit())
  }
  const onWillQuit = (event: { preventDefault: () => void }): void => {
    app.off('window-all-closed', resumeQuit)
    try {
      applyUpdate(update, undefined, () => app.relaunch({ execPath: app.getPath('exe') }))
    } catch (error) {
      event.preventDefault()
      restartRequested = false
      dialog.showErrorBox('Unable to install update', String(error))
    }
  }
  // Window state persistence cancels the first quit while closing asynchronously.
  // macOS keeps the process alive after that close, so resume once every window is gone.
  app.once('window-all-closed', resumeQuit)
  app.once('will-quit', onWillQuit)
  setImmediate(() => app.quit())
}
