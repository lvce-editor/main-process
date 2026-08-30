import * as ElectronBrowserViewEventListenerPageFaviconUpdated from '../ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'
import * as ElectronBrowserViewFaviconState from '../ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

export const key = 'did-navigate'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.DidNavigate, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.DidNavigate, listener)
}

const loadDefaultFavicon = async (webContents, url: string): Promise<readonly string[]> => {
  let faviconUrl
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return []
    }
    faviconUrl = new URL('/favicon.ico', parsedUrl).href
  } catch {
    return []
  }
  if (ElectronBrowserViewFaviconState.has(webContents, url)) {
    return []
  }
  const favicons = await ElectronBrowserViewEventListenerPageFaviconUpdated.resolveNetworkFavicon([faviconUrl])
  if (favicons.length === 0 || webContents.getURL() !== url) {
    return []
  }
  return favicons
}

export const handler = async (_event, url, _httpResponseCode, _httpStatusText, _webContentsId, webContents) => {
  const favicons = await loadDefaultFavicon(webContents, url)
  const messages = favicons.length > 0 ? [['handleDidNavigate', url], ['handlePageFaviconUpdated', favicons]] : [['handleDidNavigate', url]]
  return {
    messages,
    result: undefined,
  }
}
