import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

let config

const createConfig = () => {
  const configPath = join(root, 'config.json')
  const config = readFileSync(configPath, 'utf8')
  const parsedConfig = JSON.parse(config)
  return parsedConfig
}

export const getOrCreateConfig = () => {
  if (!config) {
    config = createConfig()
  }
  return config
}
