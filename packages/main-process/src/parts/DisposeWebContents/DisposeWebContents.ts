import type { WebContents } from 'electron'

export const disposeWebContents = (webContents: WebContents) => {
  if (webContents.close) {
    // electron v22
    webContents.close()
    // @ts-ignore
  } else if (webContents.destroy) {
    // older versions of electron
    // @ts-ignore
    webContents.destroy()
  }
}
