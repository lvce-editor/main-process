/* eslint-disable n/no-unsupported-features/node-builtins -- Electron 43 provides the node:sqlite API used by the main process */
import { DatabaseSync } from 'node:sqlite'

export interface ChromeCookieRow {
  readonly encryptedValue: Uint8Array
  readonly expiresUtc: string
  readonly hasExpires: number
  readonly hostKey: string
  readonly isHttpOnly: number
  readonly isSecure: number
  readonly name: string
  readonly path: string
  readonly sameSite: number
  readonly topFrameSiteKey: string
  readonly value: string
}

export interface ChromeCookieDatabase {
  readonly rows: readonly ChromeCookieRow[]
  readonly version: number
}

const getDatabaseError = (error: unknown): Error => {
  const message = error instanceof Error ? error.message : String(error)
  if (message.toLowerCase().includes('locked') || message.toLowerCase().includes('busy')) {
    return new Error('Chrome cookie database is busy. Close Chrome and try again.')
  }
  return new Error('Failed to read the Chrome cookie database')
}

const withDatabase = <T>(path: string, fn: (database: DatabaseSync) => T): T => {
  let database: DatabaseSync | undefined
  try {
    database = new DatabaseSync(path, { readOnly: true })
    database.exec('PRAGMA busy_timeout = 1000')
    return fn(database)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported Chrome cookie database version')) {
      throw error
    }
    throw getDatabaseError(error)
  } finally {
    database?.close()
  }
}

const getVersion = (database: DatabaseSync): number => {
  const row = database.prepare(`SELECT value FROM meta WHERE key = 'version'`).get() as { readonly value?: string } | undefined
  const version = Number(row?.value)
  if (version !== 24) {
    throw new Error(`Unsupported Chrome cookie database version ${Number.isFinite(version) ? version : 'unknown'}`)
  }
  return version
}

export const getCookieCount = (path: string): number => {
  return withDatabase(path, (database) => {
    getVersion(database)
    const row = database.prepare('SELECT COUNT(*) AS count FROM cookies').get() as { readonly count: number }
    return row.count
  })
}

export const readCookies = (path: string): ChromeCookieDatabase => {
  return withDatabase(path, (database) => {
    const version = getVersion(database)
    const rows = database
      .prepare(
        `
        SELECT
          encrypted_value AS encryptedValue,
          CAST(expires_utc AS TEXT) AS expiresUtc,
          has_expires AS hasExpires,
          host_key AS hostKey,
          is_httponly AS isHttpOnly,
          is_secure AS isSecure,
          name,
          path,
          samesite AS sameSite,
          top_frame_site_key AS topFrameSiteKey,
          value
        FROM cookies
      `,
      )
      .all() as unknown as readonly ChromeCookieRow[]
    return {
      rows,
      version,
    }
  })
}
