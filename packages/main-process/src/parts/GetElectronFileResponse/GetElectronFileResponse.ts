import { getElectronFileResponseIpc } from '../GetElectronFileResponseIpc/GetElectronFileResponseIpc.ts'

export const getElectronFileResponse = async (url: string, request: any): Promise<Response> => {
  const useIpc = true
  if (useIpc) {
    return getElectronFileResponseIpc(url, request)
  }
  throw new Error(`unsupported`)
}
