import * as GetElectronFileResponse from '../GetElectronFileResponse/GetElectronFileResponse.ts'
import * as SerializeRequest from '../SerializeRequest/SerializeRequest.ts'

/**
 *
 * @param {GlobalRequest} request
 */
export const handleRequest = (request) => {
  const serialized = SerializeRequest.serializeRequest(request)
  return GetElectronFileResponse.getElectronFileResponse(request.url, serialized)
}
