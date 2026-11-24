import { scheme } from '../Platform/Platform.ts'

export const getRelativePath = (url: string) => {
  const relative = url.slice(scheme.length + 4)
  const suffixIndex = relative.search(/[?#]/u)
  return suffixIndex === -1 ? relative : relative.slice(0, suffixIndex)
}
