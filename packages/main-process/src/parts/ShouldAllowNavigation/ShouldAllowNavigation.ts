import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

export const shouldAllowNavigation = (webContentsId) => {
  return ElectronWebContentsViewState.hasWebContents(webContentsId)
}
