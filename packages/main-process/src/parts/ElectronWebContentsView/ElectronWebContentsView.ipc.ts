import * as ElectronWebContentsView from './ElectronWebContentsView.ts'

export const name = 'ElectronWebContentsView'

export const Commands = {
  attachEventListeners: ElectronWebContentsView.attachEventListeners,
  createWebContentsView: ElectronWebContentsView.createWebContentsView,
  disposeWebContentsView: ElectronWebContentsView.disposeWebContentsView,
}
