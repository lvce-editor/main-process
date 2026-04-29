import { join } from 'node:path'

const isStaticAssetDirectory = (entry: string): boolean => {
  return /^[a-f0-9]{7,}$/.test(entry)
}

export const getStaticAssetRoot = (staticPath: string, entries: readonly string[]): string => {
  const assetDirectory = entries.find(isStaticAssetDirectory)
  if (!assetDirectory) {
    throw new Error('Could not find static asset directory')
  }
  return join(staticPath, assetDirectory)
}
