import type { Session } from 'electron'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'
import * as FirefoxCookieConversion from '../FirefoxCookieConversion/FirefoxCookieConversion.ts'
import * as FirefoxCookieDatabase from '../FirefoxCookieDatabase/FirefoxCookieDatabase.ts'
import * as FirefoxCookieProfile from '../FirefoxCookieProfile/FirefoxCookieProfile.ts'

export interface FirefoxCookieImportInfo {
  readonly cookieCount: number
  readonly profileDirectory: string
  readonly profileName: string
}

export interface FirefoxCookieImportResult {
  readonly failed: number
  readonly imported: number
  readonly skipped: number
}

type CookieSession = Pick<Session, 'cookies'>

export const getInfoFromDirectory = (firefoxDataDirectory: string): FirefoxCookieImportInfo => {
  const profile = FirefoxCookieProfile.getActiveProfile(firefoxDataDirectory)
  const cookieCount = FirefoxCookieDatabase.getCookieCount(profile.cookieDatabasePath)
  return {
    cookieCount,
    profileDirectory: profile.directory,
    profileName: profile.name,
  }
}

export const getInfo = (): FirefoxCookieImportInfo => {
  return getInfoFromDirectory(FirefoxCookieProfile.getFirefoxDataDirectory())
}

export const importFromDirectory = async (firefoxDataDirectory: string, session: CookieSession): Promise<FirefoxCookieImportResult> => {
  const profile = FirefoxCookieProfile.getActiveProfile(firefoxDataDirectory)
  const { rows, version } = FirefoxCookieDatabase.readCookies(profile.cookieDatabasePath)
  const cookies: Electron.CookiesSetDetails[] = []
  let skipped = 0
  for (const row of rows) {
    const cookie = FirefoxCookieConversion.convert(row, version)
    if (cookie) {
      cookies.push(cookie)
    } else {
      skipped++
    }
  }
  let imported = 0
  let failed = 0
  for (const cookie of cookies) {
    try {
      await session.cookies.set(cookie)
      imported++
    } catch {
      failed++
    }
  }
  await session.cookies.flushStore()
  return {
    failed,
    imported,
    skipped,
  }
}

export const importCookies = async (): Promise<FirefoxCookieImportResult> => {
  return importFromDirectory(FirefoxCookieProfile.getFirefoxDataDirectory(), ElectronSessionForBrowserView.getSession())
}
