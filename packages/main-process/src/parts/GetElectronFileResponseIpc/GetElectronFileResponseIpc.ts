import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const getElectronFileResponseIpc = async (url: string, request: any): Promise<Response> => {
  const { body, init } = await SharedProcess.invoke('GetElectronFileResponse.getElectronFileResponse', url, request)
  const response = new Response(body, init)
  return response
}
