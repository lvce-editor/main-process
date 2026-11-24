import { app } from 'electron'

let pending = false

const resumeQuit = (): void => {
  setImmediate(() => app.quit())
}

const relaunch = (): void => {
  cancel()
  app.relaunch({ args: process.argv.slice(1), execPath: app.getPath('exe') })
}

export const cancel = (): void => {
  pending = false
  app.off('window-all-closed', resumeQuit)
  app.off('will-quit', relaunch)
}

export const restart = (): void => {
  if (pending) {
    return
  }
  pending = true
  // Relaunch only after every window has approved closing and saved its state.
  app.once('will-quit', relaunch)
  app.once('window-all-closed', resumeQuit)
  setImmediate(() => {
    if (pending) {
      app.quit()
    }
  })
}
