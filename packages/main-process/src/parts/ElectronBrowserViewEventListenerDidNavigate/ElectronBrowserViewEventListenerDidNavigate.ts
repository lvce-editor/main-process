import * as ElectronBrowserViewEventListenerPageFaviconUpdated from '../ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'
import * as ElectronBrowserViewFaviconState from '../ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as EmbedsProcess from '../EmbedsProcess/EmbedsProcess.ts'

export const key = 'did-navigate'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.DidNavigate, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.DidNavigate, listener)
}

const loadDefaultFavicon = async (event, url: string, webContentsId: number): Promise<void> => {
  let faviconUrl
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return
    }
    faviconUrl = new URL('/favicon.ico', parsedUrl).href
  } catch {
    return
  }
  const favicons = await ElectronBrowserViewEventListenerPageFaviconUpdated.resolveNetworkFavicon([faviconUrl])
  if (favicons.length === 0 || event.sender.getURL() !== url || ElectronBrowserViewFaviconState.has(event.sender, url)) {
    return
  }
  EmbedsProcess.send('ElectronWebContents.handlePageFaviconUpdated', webContentsId, favicons)
}

export const handler = (event, url, _httpResponseCode, _httpStatusText, webContentsId) => {
  void loadDefaultFavicon(event, url, webContentsId)
  return {
    messages: [['handleDidNavigate', url]],
    result: undefined,
  }
}
