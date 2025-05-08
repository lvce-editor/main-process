import * as IsProtocolHandleApiSupported from '../IsProtocolHandleApiSupported/IsProtocolHandleApiSupported.ts'
import * as PrivilegedSchemes from '../PrivilegedSchemes/PrivilegedSchemes.ts'

interface RequestHandler {
  (request: GlobalRequest): Promise<GlobalResponse>
}

export const handle = (protocol: Electron.Protocol, name: string, handleRequest: RequestHandler) => {
  if (IsProtocolHandleApiSupported.isProtocolHandleApiSupported(protocol)) {
    protocol.handle(name, handleRequest)
    return
  }
  throw new Error('protocol.handle api is not supported')
}

export const enable = (protocol: Electron.Protocol) => {
  protocol.registerSchemesAsPrivileged(PrivilegedSchemes.privilegedSchems)
}
