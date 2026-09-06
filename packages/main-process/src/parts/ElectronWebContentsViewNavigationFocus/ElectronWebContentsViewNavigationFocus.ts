import type { WebContents } from 'electron'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const attach = (webContents: WebContents, parentWebContents: WebContents): void => {
  let shouldRestoreParentFocus = false
  const cancel = (): void => {
    shouldRestoreParentFocus = false
  }
  parentWebContents.on('blur', cancel)
  webContents.once('destroyed', () => parentWebContents.off('blur', cancel))

  webContents.on(ElectronWebContentsEventType.DidStartNavigation, (_event, _url, _isInPlace, isMainFrame) => {
    if (!isMainFrame) {
      return
    }
    shouldRestoreParentFocus = parentWebContents.isFocused()
  })

  webContents.on(ElectronWebContentsEventType.DidNavigate, () => {
    if (!shouldRestoreParentFocus || parentWebContents.isDestroyed()) {
      return
    }
    shouldRestoreParentFocus = false
    parentWebContents.focus()
  })
}
