import type { Session } from 'electron'
import * as ChromeCookieConversion from '../ChromeCookieConversion/ChromeCookieConversion.ts'
import * as ChromeCookieDatabase from '../ChromeCookieDatabase/ChromeCookieDatabase.ts'
import { UnsupportedChromeCookieEncryptionError } from '../ChromeCookieDecrypt/ChromeCookieDecrypt.ts'
import * as ChromeCookieProfile from '../ChromeCookieProfile/ChromeCookieProfile.ts'
import * as ElectronSessionForBrowserView from '../ElectronSessionForBrowserView/ElectronSessionForBrowserView.ts'

export interface ChromeCookieImportInfo {
  readonly cookieCount: number
  readonly profileDirectory: string
  readonly profileName: string
}

export interface ChromeCookieImportResult {
  readonly failed: number
  readonly imported: number
  readonly skipped: number
}

type CookieSession = Pick<Session, 'cookies'>

const assertLinux = (): void => {
  if (process.platform !== 'linux') {
    throw new Error('Importing Chrome cookies is only supported on Linux')
  }
}

export const getInfoFromDirectory = (chromeDataDirectory: string): ChromeCookieImportInfo => {
  const profile = ChromeCookieProfile.getActiveProfile(chromeDataDirectory)
  const cookieCount = ChromeCookieDatabase.getCookieCount(profile.cookieDatabasePath)
  return {
    cookieCount,
    profileDirectory: profile.directory,
    profileName: profile.name,
  }
}

export const getInfo = (): ChromeCookieImportInfo => {
  assertLinux()
  return getInfoFromDirectory(ChromeCookieProfile.getChromeDataDirectory())
}

export const importFromDirectory = async (chromeDataDirectory: string, session: CookieSession): Promise<ChromeCookieImportResult> => {
  const profile = ChromeCookieProfile.getActiveProfile(chromeDataDirectory)
  const { rows, version } = ChromeCookieDatabase.readCookies(profile.cookieDatabasePath)
  const cookies: Electron.CookiesSetDetails[] = []
  let skipped = 0
  let unsupportedEncryption = 0
  for (const row of rows) {
    try {
      const cookie = ChromeCookieConversion.convert(row, version)
      if (cookie) {
        cookies.push(cookie)
      } else {
        skipped++
      }
    } catch (error) {
      skipped++
      if (error instanceof UnsupportedChromeCookieEncryptionError) {
        unsupportedEncryption++
      }
    }
  }
  if (cookies.length === 0 && unsupportedEncryption > 0) {
    throw new Error('Unsupported Chrome cookie encryption format')
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

export const importCookies = async (): Promise<ChromeCookieImportResult> => {
  assertLinux()
  return importFromDirectory(ChromeCookieProfile.getChromeDataDirectory(), ElectronSessionForBrowserView.getSession())
}
