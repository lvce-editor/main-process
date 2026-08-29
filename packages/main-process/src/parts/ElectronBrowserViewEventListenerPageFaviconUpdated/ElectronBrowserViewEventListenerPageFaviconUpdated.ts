import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

const maxFaviconBytes = 1024 * 1024

export const key = ElectronWebContentsEventType.PageFaviconUpdated

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.PageFaviconUpdated, listener)
}

const getFaviconDataUrl = async (event, favicon: string): Promise<string> => {
  if (favicon.startsWith('data:')) {
    return favicon
  }
  try {
    const response = await event.sender.session.fetch(favicon)
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

const resolveFavicon = async (event, favicons: readonly string[]): Promise<readonly string[]> => {
  for (const favicon of favicons) {
    const dataUrl = await getFaviconDataUrl(event, favicon)
    if (dataUrl) {
      return [dataUrl]
    }
  }
  return favicons
}

export const handler = async (event, favicons: readonly string[]): Promise<any> => {
  const pageUrl = event.sender.getURL()
  const resolvedFavicons = await resolveFavicon(event, favicons)
  return {
    messages: event.sender.getURL() === pageUrl ? [['handlePageFaviconUpdated', resolvedFavicons]] : [],
    result: undefined,
  }
}
