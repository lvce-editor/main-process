import * as ElectronBrowserViewFaviconState from '../ElectronBrowserViewFaviconState/ElectronBrowserViewFaviconState.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

const maxFaviconBytes = 1024 * 1024
const faviconFetchTimeout = 2000

export const key = ElectronWebContentsEventType.PageFaviconUpdated

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

const getFaviconDataUrl = async (fetcher, favicon: string, signal: AbortSignal): Promise<string> => {
  try {
    const response = await fetcher(favicon, { signal })
    if (!response.ok) {
      return ''
    }
    const contentLength = Number(response.headers.get('content-length'))
    if (contentLength > maxFaviconBytes) {
      return ''
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > maxFaviconBytes) {
      return ''
    }
    const contentType = response.headers.get('content-type') || 'image/x-icon'
    const mimeType = contentType.split(';', 1)[0].trim()
    if (!mimeType.startsWith('image/') && mimeType !== 'application/octet-stream') {
      return ''
    }
    return `data:${mimeType};base64,${bytes.toString('base64')}`
  } catch {
    return ''
  }
}

const resolveWithFetcher = async (fetcher, favicons: readonly string[], signal: AbortSignal): Promise<string> => {
  for (const favicon of favicons) {
    const dataUrl = await getFaviconDataUrl(fetcher, favicon, signal)
    if (dataUrl) {
      return dataUrl
    }
  }
  return ''
}

const resolveWithTimeout = async (fetcher, favicons: readonly string[]): Promise<string> => {
  const controller = new AbortController()
  let timeout: NodeJS.Timeout | undefined
  const timeoutPromise = new Promise<string>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort()
      resolve('')
    }, faviconFetchTimeout)
  })
  try {
    return await Promise.race([resolveWithFetcher(fetcher, favicons, controller.signal), timeoutPromise])
  } finally {
    clearTimeout(timeout)
  }
}

const resolveFavicon = async (webContents, favicons: readonly string[]): Promise<readonly string[]> => {
  const dataUrl = favicons.find((favicon) => favicon.startsWith('data:'))
  if (dataUrl) {
    return [dataUrl]
  }
  const sessionFavicon = await resolveWithTimeout((url, options) => webContents.session.fetch(url, options), favicons)
  if (sessionFavicon) {
    return [sessionFavicon]
  }
  const networkFavicons = await resolveNetworkFavicon(favicons)
  return networkFavicons.length > 0 ? networkFavicons : favicons
}

export const resolveNetworkFavicon = async (favicons: readonly string[]): Promise<readonly string[]> => {
  const dataUrl = favicons.find((favicon) => favicon.startsWith('data:'))
  if (dataUrl) {
    return [dataUrl]
  }
  const networkFavicon = await resolveWithTimeout((url, options) => fetch(url, options), favicons)
  return networkFavicon ? [networkFavicon] : []
}

export const handler = async (_event, favicons: readonly string[], _webContentsId, webContents): Promise<any> => {
  const pageUrl = webContents.getURL()
  if (favicons.length > 0) {
    ElectronBrowserViewFaviconState.set(webContents, pageUrl)
  }
  const resolvedFavicons = await resolveFavicon(webContents, favicons)
  return {
    messages: webContents.getURL() === pageUrl ? [['handlePageFaviconUpdated', resolvedFavicons]] : [],
    result: undefined,
  }
}
