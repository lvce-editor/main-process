import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getElectronFileResponseIpc } from '../GetElectronFileResponseIpc/GetElectronFileResponseIpc.ts'
import { getFileResponse } from '../GetFileResponse/GetFileResponse.ts'
import { getNotFoundResponse } from '../GetNotFoundResponse/GetNotFoundResponse.ts'
import { getOrCreateConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { scheme } from '../Platform/Platform.ts'
import { root } from '../Root/Root.ts'

const getRelativePath = (url: string) => {
  const relative = url.slice(scheme.length + 4)
  return relative
}

const getActualPath = (relative: string) => {
  const actual = relative === '/' ? '/index.html' : relative
  return actual
}

const getAbsolutePath = (relative: string) => {
  const actual = getActualPath(relative)
  const absolutePath = join(root, 'static', actual)
  return absolutePath
}

export const getElectronFileResponseConfig = async (url: string, request: any): Promise<Response> => {
  const parsedConfig = getOrCreateConfig()
  const { files, headers } = parsedConfig
  const relative = getRelativePath(url)
  if (relative.startsWith('/remote')) {
    return getElectronFileResponseIpc(url, request)
  }
  const actual = getActualPath(relative)
  const match = files[actual]
  if (match === undefined) {
    return getNotFoundResponse()
  }
  const responseHeaders = headers[match]
  const absolutePath = getAbsolutePath(match)
  if (!existsSync(absolutePath)) {
    return getNotFoundResponse()
  }
  return getFileResponse(absolutePath, responseHeaders)
}
