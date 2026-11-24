import type { BrowserWindow, BrowserWindowConstructorOptions, TitleBarOverlayOptions } from 'electron'

interface WindowAppearance {
  readonly backgroundColor: string
  readonly titleBarOverlay?: TitleBarOverlayOptions
}

type AppearanceByPath = Readonly<Record<string, WindowAppearance | undefined>>

export const track = (
  window: BrowserWindow,
  options: BrowserWindowConstructorOptions,
  appearanceByPath: AppearanceByPath,
  initialUrl: string,
): void => {
  const initialLocation = new URL(initialUrl)
  const defaultOverlay =
    (process.platform === 'linux' || process.platform === 'win32') && options.titleBarStyle === 'hidden' && typeof options.titleBarOverlay === 'object'
      ? options.titleBarOverlay
      : undefined
  let currentAppearance: WindowAppearance | undefined

  const update = (location: URL): void => {
    const sameApp = location.protocol === initialLocation.protocol && location.host === initialLocation.host
    const appearance = sameApp ? appearanceByPath[location.pathname] : undefined
    if (appearance === currentAppearance) {
      return
    }
    window.setBackgroundColor(appearance?.backgroundColor ?? options.backgroundColor ?? '#ffffff')
    if (defaultOverlay) {
      window.setTitleBarOverlay({ ...defaultOverlay, ...appearance?.titleBarOverlay })
    }
    currentAppearance = appearance
  }

  update(initialLocation)
  window.webContents.on('did-navigate', (_event, url) => {
    update(new URL(url))
  })
  window.webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    if (isMainFrame) {
      update(new URL(url))
    }
  })
}
