import { join } from 'node:path'

const isStaticAssetDirectory = (entry) => {
  return /^[a-f0-9]{7,}$/.test(entry)
}

export const getStaticAssetRoot = (staticPath, entries) => {
  const assetDirectory = entries.find(isStaticAssetDirectory)
  if (!assetDirectory) {
    throw new Error('Could not find static asset directory')
  }
  return join(staticPath, assetDirectory)
}
