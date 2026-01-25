import * as GetElectronFileResponse from '../GetElectronFileResponse/GetElectronFileResponse.ts'
import * as SerializeRequest from '../SerializeRequest/SerializeRequest.ts'

export const handleRequest = (request: GlobalRequest): Promise<GlobalResponse> => {
  const serialized = SerializeRequest.serializeRequest(request)
  return GetElectronFileResponse.getElectronFileResponse(request.url, serialized)
}
