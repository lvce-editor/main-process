import * as Electron from 'electron'
import * as HandlePermission from '../HandlePermission/HandlePermission.ts'
import * as HandleRequest from '../HandleRequest/HandleRequest.ts'
import * as IsSessionCacheEnabled from '../IsSessionCacheEnabled/IsSessionCacheEnabled.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Protocol from '../Protocol/Protocol.ts'

// TODO maybe create a separate session for webviews
export const createElectronSession = () => {
  const sessionId = Platform.getSessionId()
  const session = Electron.session.fromPartition(sessionId, {
    cache: IsSessionCacheEnabled.isSessionCacheEnabled,
  })
  session.setPermissionRequestHandler(HandlePermission.handlePermissionRequest)
  session.setPermissionCheckHandler(HandlePermission.handlePermissionCheck)
  Protocol.handle(session.protocol, Platform.scheme, HandleRequest.handleRequest)
  return session
}
