import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getOrCreateConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { scheme } from '../Platform/Platform.ts'
import { root } from '../Root/Root.ts'

export const getElectronFileResponseConfig = async (url: string, request: any): Promise<Response> => {
  const parsedConfig = getOrCreateConfig()
  const { files, headers } = parsedConfig
  const relative = url.slice(scheme.length + 4)
  const actual = relative === '/' ? '/index.html' : relative
  const match = files[actual]
  if (match === undefined) {
    return new Response('Not Found', { status: 404 })
  }
  const responseHeaders = headers[match]
  const absolutePath = join(root, 'static', actual)
  if (!existsSync(absolutePath)) {
    return new Response('Not Found', { status: 404 })
  }
  const content = readFileSync(absolutePath, 'utf8')
  const response = new Response(content, {
    headers: responseHeaders,
    status: 200,
  })
  return response
}
