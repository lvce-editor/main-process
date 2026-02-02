import { existsSync } from 'node:fs'
import { getAbsolutePath } from '../GetAbsolutePath/GetAbsolutePath.ts'
import { getActualPath } from '../GetActualPath/GetActualPath.ts'
import { getElectronFileResponseIpc } from '../GetElectronFileResponseIpc/GetElectronFileResponseIpc.ts'
import { getFileResponse } from '../GetFileResponse/GetFileResponse.ts'
import { getNotFoundResponse } from '../GetNotFoundResponse/GetNotFoundResponse.ts'
import { getOrCreateConfig } from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import { getRelativePath } from '../GetRelativePath/GetRelativePath.ts'

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
  const absolutePath = getAbsolutePath(actual)
  if (!existsSync(absolutePath)) {
    return getNotFoundResponse()
  }
  return getFileResponse(absolutePath, responseHeaders)
}
