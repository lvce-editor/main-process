interface EventSource {
  off(event: string, listener: () => void): unknown
  once(event: string, listener: () => void): unknown
}

interface StartupWindow extends EventSource {
  show(): void
  readonly webContents: EventSource
}

export const showWindowWhenLoaded = (window: StartupWindow): void => {
  const dispose = (): void => {
    window.off('ready-to-show', show)
    window.webContents.off('did-finish-load', show)
    window.off('closed', dispose)
  }
  const show = (): void => {
    dispose()
    window.show()
  }
  // On Wayland, ready-to-show may never fire for an initially hidden window.
  // Load completion also permits showing it, without waiting for a first paint.
  window.once('ready-to-show', show)
  window.webContents.once('did-finish-load', show)
  window.once('closed', dispose)
}
