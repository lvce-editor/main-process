import { app, dialog } from 'electron'
import { dirname } from 'node:path'
import type { StagedUpdate } from '../MacUpdate/MacUpdate.ts'
import { applyUpdate, stageUpdate } from '../MacUpdate/MacUpdate.ts'
import * as Platform from '../Platform/Platform.ts'

let staged: StagedUpdate | undefined
let pending: Promise<void> | undefined
let restartRequested = false

export const stage = async (diskImage: string, version: string): Promise<void> => {
  if (process.platform !== 'darwin' || !Platform.isProduction) {
    throw new Error('macOS updates require an installed application build')
  }
  if (staged?.version === version) {
    return
  }
  if (pending || staged) {
    throw new Error('An update is already staged or being prepared; restart before installing another update')
  }
  const contentsPath = dirname(dirname(app.getPath('exe')))
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
  const onWillQuit = (event: { preventDefault: () => void }): void => {
    try {
      applyUpdate(update, undefined, () => app.relaunch({ execPath: app.getPath('exe') }))
    } catch (error) {
      event.preventDefault()
      restartRequested = false
      dialog.showErrorBox('Unable to install update', String(error))
    }
  }
  app.once('will-quit', onWillQuit)
  setImmediate(() => app.quit())
}
