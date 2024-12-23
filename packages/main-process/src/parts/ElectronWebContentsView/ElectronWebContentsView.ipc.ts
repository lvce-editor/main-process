import * as ElectronWebContentsView from './ElectronWebContentsView.ts'

export const name = 'ElectronWebContentsView'

export const Commands = {
  createWebContentsView: ElectronWebContentsView.createWebContentsView,
  attachEventListeners: ElectronWebContentsView.attachEventListeners,
  disposeWebContentsView: ElectronWebContentsView.disposeWebContentsView,
}
