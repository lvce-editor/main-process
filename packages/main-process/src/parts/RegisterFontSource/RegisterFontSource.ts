import { dirname, join } from 'node:path'
import type { ParsedConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { getFileResponse } from '../GetFileResponse/GetFileResponse.ts'
import { getNotFoundResponse } from '../GetNotFoundResponse/GetNotFoundResponse.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Protocol from '../Protocol/Protocol.ts'

// The packaged stylesheet uses this route directly. Existing font URLs, fetches,
// and worker requests retain their original handler and response semantics.
export const registerFontSource = (session: Electron.Session, config: ParsedConfig, root: string, useSource = true): boolean => {
  const fontPath = Object.keys(config.files).find((path) => path.endsWith('/fonts/FiraCode-VariableFont.ttf'))
  if (!fontPath) {
    return false
  }
  const origin = `${Platform.scheme}://-`
  const headers = {
    ...config.headers[config.files[fontPath]],
    'Access-Control-Allow-Origin': origin,
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }
  if (!useSource || typeof session.protocol.registerSource !== 'function') {
    Protocol.handle(session.protocol, Platform.fontScheme, async (request) => {
      const url = new URL(request.url)
      if (url.pathname !== '/fonts/FiraCode-VariableFont.ttf' || (request.method !== 'GET' && request.method !== 'HEAD')) {
        return getNotFoundResponse()
      }
      if (request.method === 'HEAD') {
        return new Response(null, { headers })
      }
      return getFileResponse(join(root, 'static', fontPath), headers)
    })
    return true
  }
  Protocol.registerSource(session.protocol, Platform.fontScheme, {
    routes: [
      {
        match: { path: '/fonts/' },
        source: {
          headers,
          root: dirname(join(root, 'static', fontPath)),
          type: 'directory',
        },
      },
    ],
  })
  return true
}
