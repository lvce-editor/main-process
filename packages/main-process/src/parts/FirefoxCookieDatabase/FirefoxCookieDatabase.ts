/* eslint-disable n/no-unsupported-features/node-builtins -- Electron 43 provides the node:sqlite API used by the main process */
import { DatabaseSync } from 'node:sqlite'

export interface FirefoxCookieRow {
  readonly expiry: number
  readonly host: string
  readonly isHttpOnly: number
  readonly isSecure: number
  readonly name: string
  readonly originAttributes: string
  readonly path: string
  readonly sameSite: number
  readonly value: string
}

export interface FirefoxCookieDatabase {
  readonly rows: readonly FirefoxCookieRow[]
  readonly version: number
}

const getDatabaseError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error)
  if (message.toLowerCase().includes('locked') || message.toLowerCase().includes('busy')) {
    return new Error('Firefox cookie database is busy. Close Firefox and try again.')
  }
  return new Error('Failed to read the Firefox cookie database')
}

const withDatabase = <T>(path: string, fn: (database: DatabaseSync) => T): T => {
  let database: DatabaseSync | undefined
  try {
    database = new DatabaseSync(path, { readOnly: true })
    database.exec('PRAGMA busy_timeout = 1000')
    return fn(database)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported Firefox cookie database version')) {
      throw error
    }
    throw getDatabaseError(error)
  } finally {
    database?.close()
  }
}

const getVersion = (database: DatabaseSync): number => {
  const row = database.prepare('PRAGMA user_version').get() as { readonly user_version: number }
  if (row.user_version < 9) {
    throw new Error(`Unsupported Firefox cookie database version ${row.user_version}`)
  }
  return row.user_version
}

export const getCookieCount = (path: string): number => {
  return withDatabase(path, (database) => {
    getVersion(database)
    const row = database.prepare('SELECT COUNT(*) AS count FROM moz_cookies').get() as { readonly count: number }
    return row.count
  })
}

export const readCookies = (path: string): FirefoxCookieDatabase => {
  return withDatabase(path, (database) => {
    const version = getVersion(database)
    const rows = database
      .prepare(
        `
        SELECT
          expiry,
          host,
          isHttpOnly,
          isSecure,
          name,
          originAttributes,
          path,
          sameSite,
          value
        FROM moz_cookies
      `,
      )
      .all() as unknown as readonly FirefoxCookieRow[]
    return {
      rows,
      version,
    }
  })
}
