import type { WebContents } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

interface State {
  audible: boolean
  hidden: boolean
  enabled: boolean
  frozen: boolean
  pending: Promise<void>
}

const states = new WeakMap<WebContents, State>()

const reconcile = (webContents: WebContents, state: State): Promise<void> => {
  const update = async (): Promise<void> => {
    if (webContents.isDestroyed() || !webContents.getURL()) return
    if (!state.frozen && !webContents.isAudioMuted()) state.audible = webContents.isCurrentlyAudible()
    const frozen = state.enabled && state.hidden && (!state.audible || webContents.isAudioMuted()) && !webContents.isDevToolsOpened()
    if (state.frozen === frozen) return
    if (!webContents.debugger.isAttached()) webContents.debugger.attach()
    await webContents.debugger.sendCommand('Page.setWebLifecycleState', { state: frozen ? 'frozen' : 'active' })
    state.frozen = frozen
  }
  // Read the latest policy when each operation executes, so a late hide cannot overwrite a show.
  const pending = state.pending.then(update, update)
  state.pending = pending
  return pending
}

const getState = (webContents: WebContents): State => {
  const existing = states.get(webContents)
  if (existing) return existing
  const state: State = { audible: webContents.isCurrentlyAudible(), enabled: false, frozen: false, hidden: false, pending: Promise.resolve() }
  states.set(webContents, state)
  const update = (): void => {
    void reconcile(webContents, state).catch(console.error)
  }
  webContents.on('audio-state-changed', update)
  webContents.on('devtools-opened', update)
  webContents.on('devtools-closed', update)
  webContents.on('did-navigate', update)
  webContents.debugger.on('detach', () => {
    state.frozen = false
  })
  return state
}

export const setHidden = (id: number, hidden: boolean, enabled: boolean): Promise<void> => {
  Assert.number(id)
  Assert.boolean(hidden)
  Assert.boolean(enabled)
  const viewState = ElectronWebContentsViewState.get(id)
  if (!viewState || viewState.view.webContents.isDestroyed()) return Promise.resolve()
  const webContents = viewState.view.webContents
  const state = getState(webContents)
  state.hidden = hidden
  state.enabled = enabled
  return reconcile(webContents, state)
}

export const resume = (webContents: WebContents): Promise<void> | undefined => {
  const state = states.get(webContents)
  if (!state) return undefined
  state.hidden = false
  return reconcile(webContents, state)
}

export const refresh = (webContents: WebContents): Promise<void> | undefined => {
  const state = states.get(webContents)
  if (!state) return undefined
  return reconcile(webContents, state)
}
