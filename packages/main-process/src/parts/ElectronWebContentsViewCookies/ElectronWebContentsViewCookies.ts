import type { Session } from 'electron'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'

export interface AddCookiesResult {
  readonly added: number
  readonly failed: number
}

export interface RemoveCookie {
  readonly name: string
  readonly url: string
}

export interface RemoveCookiesResult {
  readonly failed: number
  readonly removed: number
}

type CookieSession = Pick<Session, 'cookies'>

export const addCookiesToSession = async (session: CookieSession, cookies: readonly Electron.CookiesSetDetails[]): Promise<AddCookiesResult> => {
  let added = 0
  let failed = 0
  for (const cookie of cookies) {
    try {
      await session.cookies.set(cookie)
      added++
    } catch {
      failed++
    }
  }
  await session.cookies.flushStore()
  return { added, failed }
}

export const removeCookiesFromSession = async (session: CookieSession, cookies: readonly RemoveCookie[]): Promise<RemoveCookiesResult> => {
  let failed = 0
  let removed = 0
  for (const cookie of cookies) {
    try {
      await session.cookies.remove(cookie.url, cookie.name)
      removed++
    } catch {
      failed++
    }
  }
  await session.cookies.flushStore()
  return { failed, removed }
}

export const addCookies = (cookies: readonly Electron.CookiesSetDetails[]): Promise<AddCookiesResult> => {
  return addCookiesToSession(ElectronSessionForBrowserView.getSession(), cookies)
}

export const removeCookies = (cookies: readonly RemoveCookie[]): Promise<RemoveCookiesResult> => {
  return removeCookiesFromSession(ElectronSessionForBrowserView.getSession(), cookies)
}
