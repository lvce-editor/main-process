export const shouldOpenExternal = (url: string): boolean => {
  if (url.startsWith('http:') || url.startsWith('https:')) {
    return true
  }
  return false
}
