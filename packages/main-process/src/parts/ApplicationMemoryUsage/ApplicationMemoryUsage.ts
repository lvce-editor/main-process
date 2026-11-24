// @ts-ignore
import { parse } from '@lvce-editor/jsonc-parser'
import { readFileSync } from 'node:fs'
import * as Platform from '../Platform/Platform.ts'

export const Default = 'default'
export const Reduce = 'reduce'

export const parseSetting = (content: string): string => {
  try {
    const settings = parse(content)
    if (settings && typeof settings === 'object' && settings['application.memoryUsage'] === Reduce) {
      return Reduce
    }
  } catch {
    // Invalid settings should not prevent the application from starting.
  }
  return Default
}

export const getSetting = (): string => {
  try {
    return parseSetting(readFileSync(Platform.getUserSettingsPath(), 'utf8'))
  } catch {
    return Default
  }
}
