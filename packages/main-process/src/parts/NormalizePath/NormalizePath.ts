import { fileURLToPath } from 'node:url'

export const normalizePath = (fullPath: string): string => {
  if (fullPath.startsWith('file://')) {
    return fileURLToPath(fullPath)
  }
  return fullPath
}
