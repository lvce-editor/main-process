// @ts-ignore
import { parse } from '@lvce-editor/jsonc-parser'
import { readFile } from 'node:fs/promises'

const appliedEnvironmentVariable = 'LVCE_ARGV_CONFIG_APPLIED'
const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

const getArgument = (key: string, value: string | number): string => {
  return `--${key}=${value}`
}

const getArgumentsForValue = (key: string, value: unknown): readonly string[] => {
  if (value === true) {
    return [`--${key}`]
  }
  if (value === false) {
    return []
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return [getArgument(key, value)]
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number')) {
    return value.map((item) => getArgument(key, item))
  }
  throw new TypeError(`Invalid argv.json value for "${key}": expected a boolean, string, number, or array of strings and numbers`)
}

export const parseArgvConfig = (content: string): readonly string[] => {
  const config: unknown = parse(content)
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('Invalid argv.json: expected an object')
  }
  const argumentsFromConfig: string[] = []
  for (const [key, value] of Object.entries(config)) {
    if (!keyPattern.test(key)) {
      throw new TypeError(`Invalid argv.json key "${key}"`)
    }
    argumentsFromConfig.push(...getArgumentsForValue(key, value))
  }
  return argumentsFromConfig
}

export const load = async (path: string, env: NodeJS.ProcessEnv = process.env): Promise<readonly string[]> => {
  if (env[appliedEnvironmentVariable] === '1') {
    return []
  }
  env[appliedEnvironmentVariable] = '1'
  try {
    const content = await readFile(path, 'utf8')
    return parseArgvConfig(content)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}
