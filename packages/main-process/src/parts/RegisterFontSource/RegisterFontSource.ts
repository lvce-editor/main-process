import { dirname, join } from 'node:path'
import type { ParsedConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Protocol from '../Protocol/Protocol.ts'

// Only font loads are redirected. Fetches and worker requests keep their original
// origin, response headers, and error handling in the existing protocol handler.
export const registerFontSource = (session: Electron.Session, config: ParsedConfig, root: string): boolean => {
  const fontPath = Object.keys(config.files).find((path) => path.endsWith('/fonts/FiraCode-VariableFont.ttf'))
  if (!fontPath || typeof session.protocol.registerSource !== 'function') {
    return false
  }
  const origin = `${Platform.scheme}://-`
  Protocol.registerSource(session.protocol, Platform.fontScheme, {
    routes: [
      {
        match: { path: '/fonts/' },
        source: {
          headers: {
            ...config.headers[config.files[fontPath]],
            'Access-Control-Allow-Origin': origin,
            'Cross-Origin-Resource-Policy': 'cross-origin',
          },
          root: dirname(join(root, 'static', fontPath)),
          type: 'directory',
        },
      },
    ],
  })
  session.webRequest.onBeforeRequest({ urls: [`${origin}${fontPath}*`] }, (details, callback) => {
    const url = new URL(details.url)
    if (details.resourceType === 'font' && details.method === 'GET' && url.pathname === fontPath) {
      callback({ redirectURL: `${Platform.fontScheme}://-/fonts/FiraCode-VariableFont.ttf${url.search}` })
      return
    }
    callback({})
  })
  return true
}
