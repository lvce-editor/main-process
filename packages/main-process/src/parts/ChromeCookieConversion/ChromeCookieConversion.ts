import type { ChromeCookieRow } from '../ChromeCookieDatabase/ChromeCookieDatabase.ts'
import * as ChromeCookieDecrypt from '../ChromeCookieDecrypt/ChromeCookieDecrypt.ts'

const chromeEpochOffsetMicroseconds = 11_644_473_600_000_000n
const microsecondsPerSecond = 1_000_000n

const getSameSite = (sameSite: number): Electron.CookiesSetDetails['sameSite'] => {
  switch (sameSite) {
    case 0:
      return 'no_restriction'
    case 1:
      return 'lax'
    case 2:
      return 'strict'
    default:
      return 'unspecified'
  }
}

const getExpirationDate = (expiresUtc: string): number => {
  const chromeMicroseconds = BigInt(expiresUtc)
  return Number(chromeMicroseconds - chromeEpochOffsetMicroseconds) / Number(microsecondsPerSecond)
}

const getValue = (row: ChromeCookieRow, databaseVersion: number): string => {
  if (row.value) {
    return row.value
  }
  return ChromeCookieDecrypt.decrypt(row.hostKey, row.encryptedValue, databaseVersion)
}

export const convert = (row: ChromeCookieRow, databaseVersion: number, now: number = Date.now() / 1000): Electron.CookiesSetDetails | undefined => {
  if (!row.hostKey || row.topFrameSiteKey) {
    return undefined
  }
  const host = row.hostKey.startsWith('.') ? row.hostKey.slice(1) : row.hostKey
  if (!host) {
    return undefined
  }
  const secure = Boolean(row.isSecure)
  const details: Electron.CookiesSetDetails = {
    httpOnly: Boolean(row.isHttpOnly),
    name: row.name,
    path: row.path || '/',
    sameSite: getSameSite(row.sameSite),
    secure,
    url: `${secure ? 'https' : 'http'}://${host}/`,
    value: getValue(row, databaseVersion),
  }
  if (row.hostKey.startsWith('.')) {
    details.domain = row.hostKey
  }
  if (row.hasExpires) {
    const expirationDate = getExpirationDate(row.expiresUtc)
    if (!Number.isFinite(expirationDate) || expirationDate <= now) {
      return undefined
    }
    details.expirationDate = expirationDate
  }
  return details
}
