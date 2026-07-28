type LoginCallback = (username?: string, password?: string) => void

interface PendingLogin {
  readonly callback: LoginCallback
  readonly webContentsId: number
}

const pendingLogins = new Map<string, PendingLogin>()
let nextRequestId = 1

export const add = (webContentsId: number, callback: LoginCallback): string => {
  const requestId = `${webContentsId}:${nextRequestId++}`
  pendingLogins.set(requestId, {
    callback,
    webContentsId,
  })
  return requestId
}

const take = (requestId: string): PendingLogin | undefined => {
  const pendingLogin = pendingLogins.get(requestId)
  pendingLogins.delete(requestId)
  return pendingLogin
}

export const accept = (requestId: string, username: string, password: string): void => {
  const pendingLogin = take(requestId)
  pendingLogin?.callback(username, password)
}

export const cancel = (requestId: string): void => {
  const pendingLogin = take(requestId)
  pendingLogin?.callback()
}

export const cancelForWebContents = (webContentsId: number): void => {
  for (const [requestId, pendingLogin] of pendingLogins) {
    if (pendingLogin.webContentsId !== webContentsId) {
      continue
    }
    pendingLogins.delete(requestId)
    pendingLogin.callback()
  }
}

export const clear = (): void => {
  for (const pendingLogin of pendingLogins.values()) {
    pendingLogin.callback()
  }
  pendingLogins.clear()
  nextRequestId = 1
}
