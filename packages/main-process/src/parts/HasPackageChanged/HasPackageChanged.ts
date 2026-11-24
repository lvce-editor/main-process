import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getOrCreateConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { root } from '../Root/Root.ts'

export const hasPackageChanged = (): boolean => {
  const path = join(root, 'config.json')
  if (!existsSync(path)) {
    return false
  }
  const original = getOrCreateConfig()
  const installed = JSON.parse(readFileSync(path, 'utf8'))
  return typeof original.commit === 'string' && typeof installed.commit === 'string' && original.commit !== installed.commit
}
