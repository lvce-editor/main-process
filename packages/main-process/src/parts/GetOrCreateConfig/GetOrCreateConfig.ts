import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

let config: ParsedConfig | undefined

type Headers = Record<string, string>

export interface ParsedConfig {
  readonly files: Record<string, number>
  readonly headers: readonly Headers[]
}

const createConfig = (): ParsedConfig => {
  const configPath = join(root, 'config.json')
  const config = readFileSync(configPath, 'utf8')
  const parsedConfig = JSON.parse(config)
  return parsedConfig
}

export const getOrCreateConfig = (): ParsedConfig => {
  if (!config) {
    config = createConfig()
  }
  return config
}
