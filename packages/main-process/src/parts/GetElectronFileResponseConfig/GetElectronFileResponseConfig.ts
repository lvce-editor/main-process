import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getElectronFileResponseIpc } from '../GetElectronFileResponseIpc/GetElectronFileResponseIpc.ts'
import { getNotFoundResponse } from '../GetNotFoundResponse/GetNotFoundResponse.ts'
import { getOrCreateConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { scheme } from '../Platform/Platform.ts'
import { root } from '../Root/Root.ts'

const getRelativePath = (url: string) => {
  const relative = url.slice(scheme.length + 4)
  return relative
}

export const getElectronFileResponseConfig = async (url: string, request: any): Promise<Response> => {
  const parsedConfig = getOrCreateConfig()
  const { files, headers } = parsedConfig
  const relative = getRelativePath(url)
  if (relative.startsWith('/remote')) {
    return getElectronFileResponseIpc(url, request)
  }
  const actual = relative === '/' ? '/index.html' : relative
  const match = files[actual]
  if (match === undefined) {
    return getNotFoundResponse()
  }
  const responseHeaders = headers[match]
  const absolutePath = join(root, 'static', actual)
  if (!existsSync(absolutePath)) {
    return getNotFoundResponse()
  }
  const content = readFileSync(absolutePath, 'utf8')
  const response = new Response(content, {
    headers: responseHeaders,
    status: 200,
  })
  return response
}
