const faviconUrls = new WeakMap<object, string>()

export const set = (webContents: object, url: string): void => {
  faviconUrls.set(webContents, url)
}

export const has = (webContents: object, url: string): boolean => {
  return faviconUrls.get(webContents) === url
}
