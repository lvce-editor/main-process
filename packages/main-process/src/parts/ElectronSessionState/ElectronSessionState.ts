interface State {
  session: globalThis.Electron.Session | undefined
}

const state: State = {
  session: undefined,
}

export const has = (): boolean => {
  return Boolean(state.session)
}

export const get = (): globalThis.Electron.Session => {
  if (!state.session) {
    throw new Error('session is not defined')
  }
  return state.session
}

export const set = (value: globalThis.Electron.Session): void => {
  state.session = value
}
