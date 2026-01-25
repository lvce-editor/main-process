import { getElectronFileResponseConfig } from '../GetElectronFileResponseConfig/GetElectronFileResponseConfig.ts'
import { getElectronFileResponseIpc } from '../GetElectronFileResponseIpc/GetElectronFileResponseIpc.ts'
import { useIpcForResponse } from '../Platform/Platform.ts'

export const getElectronFileResponse = async (url: string, request: any): Promise<Response> => {
  if (useIpcForResponse()) {
    return getElectronFileResponseIpc(url, request)
  }
  return getElectronFileResponseConfig(url, request)
}
