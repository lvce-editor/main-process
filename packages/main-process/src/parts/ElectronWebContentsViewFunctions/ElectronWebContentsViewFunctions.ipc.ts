import * as ElectronWebContentsViewFunctions from './ElectronWebContentsViewFunctions.ts'

export const name = 'ElectronWebContentsViewFunctions'

export const Commands = {
  addToWindow: ElectronWebContentsViewFunctions.addToWindow,
  backward: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.backward),
  cancelNavigation: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.cancelNavigation),
  copyImageAt: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.copyImageAt),
  focus: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.focus),
  forward: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.forward),
  getStats: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.getStats),
  hide: ElectronWebContentsViewFunctions.hide,
  inspectElement: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.inspectElement),
  openDevtools: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.openDevtools),
  reload: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.reload),
  resizeBrowserView: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.resizeBrowserView),
  setBackgroundColor: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.setBackgroundColor),
  setFallthroughKeyBindings: ElectronWebContentsViewFunctions.setFallThroughKeyBindings,
  setIframeSrc: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.setIframeSrc),
  setIframeSrcFallback: ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.setIframeSrcFallback),
  show: ElectronWebContentsViewFunctions.show,
}