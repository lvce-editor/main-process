import { parse, type ParseError } from 'jsonc-parser'
import { readFileSync } from 'node:fs'
import * as Platform from '../Platform/Platform.ts'

const settingKey = 'application.useProtocolRegisterSource'

export const parseSetting = (content: string): boolean => {
  try {
    const errors: ParseError[] = []
    const settings = parse(content, errors, { allowTrailingComma: true })
    return Boolean(errors.length === 0 && settings && typeof settings === 'object' && settings[settingKey] === true)
  } catch {
    // Invalid settings should not prevent the application from starting.
    return false
  }
}

export const getSetting = (): boolean => {
  try {
    return parseSetting(readFileSync(Platform.getUserSettingsPath(), 'utf8'))
  } catch {
    return false
  }
}
