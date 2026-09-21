const rpcByWindow = new WeakMap<object, any>()

let lastFocusedWindow: any

export const register = (window: any, rpc: any): void => {
  rpcByWindow.set(window, rpc)
  window.on('focus', () => {
    lastFocusedWindow = window
  })
  window.once('closed', () => {
    rpcByWindow.delete(window)
    if (lastFocusedWindow === window) {
      lastFocusedWindow = undefined
    }
  })
}

export const get = (window: object): any => {
  return rpcByWindow.get(window)
}

export const getLastFocusedWindow = (): any => {
  return lastFocusedWindow
}
