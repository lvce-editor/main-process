import type { BrowserWindow, Rectangle } from 'electron'

type WindowSize = Pick<Rectangle, 'height' | 'width'>

export const limitRestoredWindowSize = (window: BrowserWindow): void => {
  let maximizedSize: WindowSize | undefined
  let restoreLimit: WindowSize | undefined

  window.on('unmaximize', () => {
    if (!maximizedSize) {
      return
    }
    // On Wayland this can still be the maximized surface, with the restored window's frame insets applied.
    const bounds = window.getBounds()
    const limit = {
      height: Math.min(maximizedSize.height, bounds.height),
      width: Math.min(maximizedSize.width, bounds.width),
    }
    maximizedSize = undefined
    const normal = window.getNormalBounds()
    if (normal.width > limit.width || normal.height > limit.height) {
      restoreLimit = limit
    }
  })

  window.on('resize', () => {
    if (window.isFullScreen()) {
      maximizedSize = undefined
      restoreLimit = undefined
      return
    }
    if (window.isMaximized()) {
      maximizedSize = window.getBounds()
      restoreLimit = undefined
      return
    }
    const limit = restoreLimit
    restoreLimit = undefined
    if (!limit) {
      return
    }
    // Wait for Electron to finish applying the compositor's restored geometry.
    setImmediate(() => {
      if (window.isDestroyed() || window.isMaximized() || window.isFullScreen()) {
        return
      }
      const { height, width } = window.getBounds()
      const restoredHeight = Math.min(height, limit.height)
      const restoredWidth = Math.min(width, limit.width)
      if (restoredHeight !== height || restoredWidth !== width) {
        window.setSize(restoredWidth, restoredHeight)
      }
    })
  })
}
