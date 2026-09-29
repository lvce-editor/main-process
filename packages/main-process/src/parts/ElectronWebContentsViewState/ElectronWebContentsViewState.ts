import * as Assert from '../Assert/Assert.ts'

const state = {
  canceled: Object.create(null),
  failedNavigationUrls: Object.create(null),
  fallThroughKeyBindings: [],
  views: Object.create(null),
}

export const add = (id, browserWindow, view, connectionId = undefined) => {
  // state
  state.views[id] = {
    browserWindow,
    ...(connectionId !== undefined && { connectionId }),
    view,
  }
}

export const hasWebContents = (id) => {
  Assert.number(id)
  return id in state.views
}
/**
 *
 * @param {number} id
 * @returns {{browserWindow: Electron.BrowserWindow, view: Electron.WebContentsView}}
 */
export const get = (id) => {
  return state.views[id]
}

export const getAll = () => {
  return Object.values(state.views)
}

export const getConnectionId = (id) => {
  return state.views[id]?.connectionId
}

export const getIdsByConnectionId = (connectionId) => {
  return Object.entries(state.views)
    .filter(([, value]: [string, any]) => value.connectionId === connectionId)
    .map(([id]) => Number.parseInt(id))
}

export const remove = (id) => {
  delete state.views[id]
  delete state.failedNavigationUrls[id]
}

export const getAnyKey = () => {
  const keys = Object.keys(state.views)
  if (keys.length === 0) {
    throw new Error('no browser view found')
  }
  return Number.parseInt(keys[0])
}

/**
 *
 * @param {import('electron').WebContents} webContents
 * @returns {import('electron').BrowserView|undefined}
 */
export const getWindow = (webContents) => {
  for (const value of Object.values(state.views)) {
    // @ts-ignore
    if (value.view.webContents === webContents) {
      // @ts-ignore
      return value.browserWindow
    }
  }
  return undefined
}

export const setFallthroughKeyBindings = (fallthroughKeyBindings) => {
  state.fallThroughKeyBindings = fallthroughKeyBindings
}

export const getFallthroughKeyBindings = () => {
  return state.fallThroughKeyBindings
}

export const isCanceled = (id) => {
  return id in state.canceled
}

export const removeCanceled = (id) => {
  delete state.canceled[id]
}

export const setCanceled = (id) => {
  state.canceled[id] = true
}

export const setFailedNavigationUrl = (id, url) => {
  state.failedNavigationUrls[id] = url
}

export const getFailedNavigationUrl = (id) => {
  return state.failedNavigationUrls[id]
}

export const removeFailedNavigationUrl = (id) => {
  delete state.failedNavigationUrls[id]
}
