import * as ElectronWindowOpenActionType from '../ElectronWindowOpenActionType/ElectronWindowOpenActionType.ts'
import * as ShouldOpenExternal from '../ShouldOpenExternal/ShouldOpenExternal.ts'

export const key = 'window-open'

export const attach = (webContents, listener) => {
  webContents.setWindowOpenHandler(listener)
}

export const detach = (webContents, listener) => {
  webContents.setWindowOpenHandler(null)
}

export const handler = (
  { disposition, url }: { disposition: string; url: string },
  _webContentsId: number,
  _webContents: Electron.WebContents,
  createWindow: (options: Electron.BrowserWindowConstructorOptions, url: string, disposition: string) => Electron.WebContents,
) => {
  const shouldCreateWindow = url === 'about:blank' || ShouldOpenExternal.shouldOpenExternal(url)
  if (!shouldCreateWindow) {
    return {
      messages: [],
      result: {
        action: ElectronWindowOpenActionType.Deny,
      },
    }
  }
  return {
    messages: [],
    result: {
      action: ElectronWindowOpenActionType.Allow,
      createWindow: (options: Electron.BrowserWindowConstructorOptions) => createWindow(options, url, disposition),
    },
  }
}
