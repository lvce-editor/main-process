import type { BrowserWindow, BrowserWindowConstructorOptions, TitleBarOverlayOptions } from 'electron'

interface WindowAppearance {
  readonly backgroundColor: string
  readonly titleBarOverlay?: TitleBarOverlayOptions
}

type AppearanceByName = Readonly<Record<string, WindowAppearance>>
const windowAppearance = new WeakMap<BrowserWindow, (name: string | null) => void>()

export const register = (
  window: BrowserWindow,
  options: BrowserWindowConstructorOptions,
  appearanceByName: AppearanceByName,
): void => {
  const defaultOverlay =
    (process.platform === 'linux' || process.platform === 'win32') && options.titleBarStyle === 'hidden' && typeof options.titleBarOverlay === 'object'
      ? options.titleBarOverlay
      : undefined
  let currentAppearance: WindowAppearance | undefined

  windowAppearance.set(window, (name) => {
    const appearance = name && Object.hasOwn(appearanceByName, name) ? appearanceByName[name] : undefined
    if (appearance === currentAppearance) {
      return
    }
    window.setBackgroundColor(appearance?.backgroundColor ?? options.backgroundColor ?? '#ffffff')
    if (defaultOverlay) {
      window.setTitleBarOverlay({ ...defaultOverlay, ...appearance?.titleBarOverlay })
    }
    currentAppearance = appearance
  })
  window.webContents.on('did-navigate', () => {
    set(window, null)
  })
}

export const set = (window: BrowserWindow, name: string | null): void => {
  windowAppearance.get(window)?.(name)
}
