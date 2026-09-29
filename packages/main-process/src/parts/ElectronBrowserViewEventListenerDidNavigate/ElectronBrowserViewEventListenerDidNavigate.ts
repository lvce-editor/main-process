import type { FaviconData } from '../ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'
import * as ElectronBrowserViewEventListenerPageFaviconUpdated from '../ElectronBrowserViewEventListenerPageFaviconUpdated/ElectronBrowserViewEventListenerPageFaviconUpdated.ts'
import * as ElectronBrowserViewFaviconState from '../ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as ElectronWebContentsViewIpc from '../ElectronWebContentsViewIpc/ElectronWebContentsViewIpc.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as WebContentsViewErrorPath from '../WebContentsViewErrorPath/WebContentsViewErrorPath.ts'

export const key = 'did-navigate'

export const attach = (webContents, listener) => {
  webContents.on(ElectronWebContentsEventType.DidNavigate, listener)
}

export const detach = (webContents, listener) => {
  webContents.off(ElectronWebContentsEventType.DidNavigate, listener)
}

const isErrorPageUrl = (url: string): boolean => {
  return url.startsWith(`file://${WebContentsViewErrorPath.webContentsViewErrorPath}`)
}

const getNavigationUrl = (webContentsId: number, url: string): string => {
  const failedNavigationUrl = ElectronWebContentsViewState.getFailedNavigationUrl(webContentsId)
  if (!failedNavigationUrl) {
    return url
  }
  if (isErrorPageUrl(url)) {
    return failedNavigationUrl
  }
  ElectronWebContentsViewState.removeFailedNavigationUrl(webContentsId)
  return url
}

const loadDefaultFavicon = async (webContents, url: string): Promise<readonly (string | FaviconData)[]> => {
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

export const handler = (_event, url, _httpResponseCode, _httpStatusText, webContentsId, webContents) => {
  const navigationUrl = getNavigationUrl(webContentsId, url)
  void loadDefaultFavicon(webContents, navigationUrl)
    .then((favicons) => {
      if (favicons.length > 0) {
        ElectronWebContentsViewIpc.send(webContentsId, 'ElectronBrowserView.handlePageFaviconUpdated', webContentsId, favicons)
      }
    })
    .catch(console.error)
  return {
    messages: [['handleDidNavigate', navigationUrl]],
    result: undefined,
  }
}
