import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

export const shouldAllowNavigation = (webContentsId) => {
  if (ElectronWebContentsViewState.hasWebContents(webContentsId)) {
    return true
  }
  return false
}
