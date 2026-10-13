import { join } from 'node:path'
import type { ParsedConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { getActualPath } from '../GetActualPath/GetActualPath.ts'
import { getNotFoundResponse } from '../GetNotFoundResponse/GetNotFoundResponse.ts'
import * as Platform from '../Platform/Platform.ts'

// Keep the application origin and its dynamic /remote worker URLs unchanged.
// The handler forwards only manifest-listed bundled files to the native loader.
export const registerResourceSource = (
  session: Electron.Session,
  config: ParsedConfig,
  root: string,
  handleRequest: (request: Request) => Promise<Response>,
): ((request: Request) => Promise<Response>) => {
  session.protocol.registerSource(Platform.resourceScheme, {
    routes: [{ source: { root: join(root, 'static'), type: 'directory' } }],
  })
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/remote')) {
      return handleRequest(request)
    }
    const path = getActualPath(url.pathname)
    if (!Object.hasOwn(config.files, path) || (request.method !== 'GET' && request.method !== 'HEAD')) {
      return getNotFoundResponse()
    }
    url.protocol = `${Platform.resourceScheme}:`
    url.pathname = path
    try {
      const response = await session.fetch(url.href, { headers: request.headers, method: request.method })
      const headers = new Headers(response.headers)
      const configuredHeaders = Object.entries(config.headers[config.files[path]])
      for (const [name, value] of configuredHeaders) {
        headers.set(name, value)
      }
      return new Response(response.body, { headers, status: response.status })
    } catch {
      return getNotFoundResponse()
    }
  }
}
