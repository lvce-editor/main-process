import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'

interface IniSection {
  readonly [key: string]: string
}

export interface FirefoxProfile {
  readonly cookieDatabasePath: string
  readonly directory: string
  readonly name: string
}

const parseIni = (content: string): Readonly<Record<string, IniSection>> => {
  const sections: Record<string, Record<string, string>> = {}
  let section: Record<string, string> | undefined
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    const sectionMatch = /^\[([^\]]+)\]$/.exec(trimmed)
    if (sectionMatch) {
      section = {}
      sections[sectionMatch[1]] = section
    } else if (section && trimmed && !trimmed.startsWith(';') && !trimmed.startsWith('#')) {
      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex !== -1) {
        section[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1)
      }
    }
  }
  return sections
}

const getProfilePath = (firefoxDataDirectory: string, profile: IniSection): string => {
  if (profile.IsRelative === '0' || isAbsolute(profile.Path)) {
    return profile.Path
  }
  return join(firefoxDataDirectory, profile.Path)
}

export const getFirefoxDataDirectory = (): string => {
  const homeDirectory = homedir()
  if (process.platform === 'win32') {
    const applicationDataDirectory = process.env.APPDATA || join(homeDirectory, 'AppData', 'Roaming')
    return join(applicationDataDirectory, 'Mozilla', 'Firefox')
  }
  if (process.platform === 'darwin') {
    return join(homeDirectory, 'Library', 'Application Support', 'Firefox')
  }
  const candidates = [
    join(homeDirectory, '.mozilla', 'firefox'),
    join(homeDirectory, 'snap', 'firefox', 'common', '.mozilla', 'firefox'),
    join(homeDirectory, '.var', 'app', 'org.mozilla.firefox', '.mozilla', 'firefox'),
  ]
  const directory = candidates.find((candidate) => existsSync(join(candidate, 'profiles.ini')))
  return directory || candidates[0]
}

export const getActiveProfile = (firefoxDataDirectory: string): FirefoxProfile => {
  const profilesPath = join(firefoxDataDirectory, 'profiles.ini')
  if (!existsSync(profilesPath)) {
    throw new Error(`Firefox profile data was not found at ${firefoxDataDirectory}`)
  }
  let sections: Readonly<Record<string, IniSection>>
  try {
    sections = parseIni(readFileSync(profilesPath, 'utf8'))
  } catch {
    throw new Error('Firefox profile metadata is invalid')
  }
  const profiles = Object.entries(sections).filter(([sectionName, profile]) => sectionName.startsWith('Profile') && profile.Path)
  const installs = Object.entries(sections).filter(([sectionName, install]) => sectionName.startsWith('Install') && install.Default)
  const installDefault = (installs.find(([, install]) => install.Locked === '1') || installs[0])?.[1].Default
  const selected =
    profiles.find(([, profile]) => profile.Path === installDefault) || profiles.find(([, profile]) => profile.Default === '1') || profiles[0]
  if (!selected) {
    throw new Error('Firefox profile metadata does not contain a profile')
  }
  const [, profile] = selected
  const profilePath = getProfilePath(firefoxDataDirectory, profile)
  const cookieDatabasePath = join(profilePath, 'cookies.sqlite')
  if (!existsSync(cookieDatabasePath)) {
    throw new Error(`Firefox cookie database was not found for profile ${profile.Path}`)
  }
  return {
    cookieDatabasePath,
    directory: profile.Path,
    name: profile.Name || profile.Path,
  }
}
