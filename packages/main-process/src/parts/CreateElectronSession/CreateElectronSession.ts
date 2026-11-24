import * as Electron from 'electron'
import * as ApplicationProtocolRegisterSource from '../ApplicationProtocolRegisterSource/ApplicationProtocolRegisterSource.ts'
import * as GetCorsResponseHeaders from '../GetCorsResponseHeaders/GetCorsResponseHeaders.ts'
import * as GetFontResponseHeaders from '../GetFontResponseHeaders/GetFontResponseHeaders.ts'
import * as GetOrCreateConfig from '../GetOrCreateConfig/GetOrCreateConfig.ts'
import * as HandlePermission from '../HandlePermission/HandlePermission.ts'
import * as HandleRequest from '../HandleRequest/HandleRequest.ts'
import * as IsSessionCacheEnabled from '../IsSessionCacheEnabled/IsSessionCacheEnabled.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Protocol from '../Protocol/Protocol.ts'
import * as RegisterFontSource from '../RegisterFontSource/RegisterFontSource.ts'
import * as RegisterResourceSource from '../RegisterResourceSource/RegisterResourceSource.ts'
import * as Root from '../Root/Root.ts'

const onHeadersReceivedCallback = (
  details: Electron.OnHeadersReceivedListenerDetails,
  callback: (headersReceivedResponse: globalThis.Electron.HeadersReceivedResponse) => void,
) => {
  callback({
    responseHeaders: details.url.startsWith(`${Platform.scheme}://-/`)
      ? GetFontResponseHeaders.getFontResponseHeaders(details.responseHeaders)
      : GetCorsResponseHeaders.getCorsResponseHeaders(details.responseHeaders),
  })
}

// TODO maybe create a separate session for webviews
export const createElectronSession = (): globalThis.Electron.Session => {
  const sessionId = Platform.getSessionId()
  const session = Electron.session.fromPartition(sessionId, {
    cache: IsSessionCacheEnabled.isSessionCacheEnabled,
  })
  session.setPermissionRequestHandler(HandlePermission.handlePermissionRequest)
  session.setPermissionCheckHandler(HandlePermission.handlePermissionCheck)
  const filter = {
    urls: ['https://*.github.com/*', 'https://release-assets.githubusercontent.com/*'],
  }
  let handleRequest = HandleRequest.handleRequest
  if (!Platform.useIpcForResponse) {
    const config = GetOrCreateConfig.getOrCreateConfig()
    const useSource = ApplicationProtocolRegisterSource.getSetting() && typeof session.protocol.registerSource === 'function'
    if (useSource) {
      handleRequest = RegisterResourceSource.registerResourceSource(session, config, Root.root, handleRequest)
    }
    if (RegisterFontSource.registerFontSource(session, config, Root.root, useSource)) {
      filter.urls.push(`${Platform.scheme}://-/`, `${Platform.scheme}://-/?*`, `${Platform.scheme}://-/*.html*`)
    }
  }
  session.webRequest.onHeadersReceived(filter, onHeadersReceivedCallback)
  Protocol.handle(session.protocol, Platform.scheme, handleRequest)
  return session
}
