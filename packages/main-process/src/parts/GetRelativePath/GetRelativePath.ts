import { scheme } from '../Platform/Platform.ts'

export const getRelativePath = (url: string) => {
  const relative = url.slice(scheme.length + 4)
  return relative
}
