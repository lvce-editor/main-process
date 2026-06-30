export const shouldOpenExternal = (url: string): boolean => {
  return url.startsWith('http:') || url.startsWith('https:')
}
