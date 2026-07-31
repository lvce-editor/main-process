import type { FirefoxCookieRow } from '../FirefoxCookieDatabase/FirefoxCookieDatabase.ts'

const millisecondsExpirySchemaVersion = 16

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

const getExpirationDate = (expiry: number, databaseVersion: number): number => {
  return databaseVersion >= millisecondsExpirySchemaVersion ? expiry / 1000 : expiry
}

const getUrlHost = (host: string): string => {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

export const convert = (row: FirefoxCookieRow, databaseVersion: number, now: number = Date.now() / 1000): Electron.CookiesSetDetails | undefined => {
  if (!row.host || row.originAttributes) {
    return undefined
  }
  const host = row.host.startsWith('.') ? row.host.slice(1) : row.host
  if (!host) {
    return undefined
  }
  const expirationDate = getExpirationDate(row.expiry, databaseVersion)
  if (!Number.isFinite(expirationDate) || expirationDate <= now) {
    return undefined
  }
  const secure = Boolean(row.isSecure)
  const details: Electron.CookiesSetDetails = {
    expirationDate,
    httpOnly: Boolean(row.isHttpOnly),
    name: row.name,
    path: row.path || '/',
    sameSite: getSameSite(row.sameSite),
    secure,
    url: `${secure ? 'https' : 'http'}://${getUrlHost(host)}/`,
    value: row.value,
  }
  if (row.host.startsWith('.')) {
    details.domain = row.host
  }
  return details
}
