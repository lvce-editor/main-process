import { scheme } from '../Platform/Platform.ts'

export const getRelativePath = (url: string) => {
  const relative = url.slice(scheme.length + 4)
  const queryIndex = relative.indexOf('?')
  return queryIndex === -1 ? relative : relative.slice(0, queryIndex)
}
