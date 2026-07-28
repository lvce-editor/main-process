import type { Event, WebContents } from 'electron'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as ElectronWebContentsViewAuthenticationState from '../ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'

interface AuthenticationResponseDetails {
  readonly url: URL
}

interface AuthInfo {
  readonly host: string
  readonly isProxy: boolean
  readonly port: number
  readonly realm: string
  readonly scheme: string
}

type LoginCallback = (username?: string, password?: string) => void

export const key = ElectronWebContentsEventType.Login

export const attach = (webContents: WebContents, listener: (...args: readonly any[]) => void): void => {
  webContents.on(ElectronWebContentsEventType.Login, listener)
}

export const detach = (webContents: WebContents, listener: (...args: readonly any[]) => void): void => {
  webContents.off(ElectronWebContentsEventType.Login, listener)
}

export const handler = (
  event: Event,
  authenticationResponseDetails: AuthenticationResponseDetails,
  authInfo: AuthInfo,
  callback: LoginCallback,
  webContentsId: number,
): any => {
  event.preventDefault()
  const requestId = ElectronWebContentsViewAuthenticationState.add(webContentsId, callback)
  return {
    messages: [
      [
        'handleLogin',
        {
          host: authInfo.host,
          isProxy: authInfo.isProxy,
          port: authInfo.port,
          realm: authInfo.realm,
          requestId,
          scheme: authInfo.scheme,
          url: String(authenticationResponseDetails.url),
        },
      ],
    ],
    result: undefined,
  }
}
