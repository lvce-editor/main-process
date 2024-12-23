import { net } from 'electron'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

/**
 *
 * @param {string} url
 * @param {any} request
 */
export const getElectronFileResponseProduction = async (url, request) => {
  const x = await net.fetch(
    'file:///home/simon/Documents/levivilet/lvce-editor/packages/main-process/src/parts/GetElectronFileResponse/GetElectronFileResponse.ts',
  )
  console.log({ x })
  // console.log({ url, request })
  const { body, init } = await SharedProcess.invoke('GetElectronFileResponse.getElectronFileResponse', url, request)
  const response = new Response(body, init)
  return response
}
