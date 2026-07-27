import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface ChromeProfileInfo {
  readonly active_time?: number
  readonly name?: string
}

interface ChromeLocalState {
  readonly profile?: {
    readonly info_cache?: Readonly<Record<string, ChromeProfileInfo>>
    readonly profiles_order?: readonly string[]
  }
}

export interface ChromeProfile {
  readonly cookieDatabasePath: string
  readonly directory: string
  readonly name: string
}

const isValidProfileDirectory = (value: string): boolean => {
  return value !== '' && value !== '.' && value !== '..' && !value.includes('/') && !value.includes('\\')
}

const getCookieDatabasePath = (chromeDataDirectory: string, profileDirectory: string): string => {
  const profilePath = join(chromeDataDirectory, profileDirectory)
  const candidates = [join(profilePath, 'Cookies'), join(profilePath, 'Network', 'Cookies')]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(`Chrome cookie database was not found for profile ${profileDirectory}`)
}

const getMostRecentlyActiveProfile = (infoCache: Readonly<Record<string, ChromeProfileInfo>>): string | undefined => {
  let selected: string | undefined
  let selectedActiveTime = -Infinity
  for (const [directory, info] of Object.entries(infoCache)) {
    if (!isValidProfileDirectory(directory)) {
      continue
    }
    const activeTime = typeof info.active_time === 'number' && Number.isFinite(info.active_time) ? info.active_time : -Infinity
    if (selected === undefined || activeTime > selectedActiveTime) {
      selected = directory
      selectedActiveTime = activeTime
    }
  }
  return selected
}

export const getChromeDataDirectory = (): string => {
  const configDirectory = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  return join(configDirectory, 'google-chrome')
}

export const getActiveProfile = (chromeDataDirectory: string): ChromeProfile => {
  const localStatePath = join(chromeDataDirectory, 'Local State')
  if (!existsSync(localStatePath)) {
    throw new Error(`Google Chrome profile data was not found at ${chromeDataDirectory}`)
  }
  let localState: ChromeLocalState
  try {
    localState = JSON.parse(readFileSync(localStatePath, 'utf8'))
  } catch {
    throw new Error('Google Chrome profile metadata is invalid')
  }
  const infoCache = localState.profile?.info_cache || {}
  const orderedProfile = localState.profile?.profiles_order?.find(isValidProfileDirectory)
  const directory = getMostRecentlyActiveProfile(infoCache) || orderedProfile || 'Default'
  const name = infoCache[directory]?.name || directory
  const cookieDatabasePath = getCookieDatabasePath(chromeDataDirectory, directory)
  return {
    cookieDatabasePath,
    directory,
    name,
  }
}
