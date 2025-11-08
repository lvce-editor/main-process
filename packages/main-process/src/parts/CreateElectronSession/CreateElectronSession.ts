import * as Electron from 'electron'
import * as HandlePermission from '../HandlePermission/HandlePermission.ts'
import * as HandleRequest from '../HandleRequest/HandleRequest.ts'
import * as IsSessionCacheEnabled from '../IsSessionCacheEnabled/IsSessionCacheEnabled.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Protocol from '../Protocol/Protocol.ts'

// details: globalThis.Electron.OnBeforeSendHeadersListenerDetails, callback: (beforeSendResponse: globalThis.Electron.BeforeSendResponse

const onBeforeSendHeadersCallback = (
  details: Electron.OnBeforeSendHeadersListenerDetails,
  callback: (beforeSendResponse: Electron.BeforeSendResponse) => void,
) => {
  if (details && details.requestHeaders) {
    // @ts-ignore
    details.requestHeaders['Origin'] = null
    details.requestHeaders['Access-Control-Allow-Origin'] = '*'
  }
  // @ts-ignore
  if (details && details.headers) {
    // @ts-ignore
    details.headers['Origin'] = null
    // @ts-ignore
    details.headers['Access-Control-Allow-Origin'] = '*'
  }
  callback({ requestHeaders: details.requestHeaders })
}

const onHeadersReceivedCallback = (
  details: Electron.OnHeadersReceivedListenerDetails,
  callback: (headersReceivedResponse: globalThis.Electron.HeadersReceivedResponse) => void,
) => {
  callback({
    responseHeaders: {
      'Access-Control-Allow-Origin': ['*'],
      ...details.responseHeaders,
    },
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
  session.webRequest.onBeforeSendHeaders(filter, onBeforeSendHeadersCallback)
  session.webRequest.onHeadersReceived(filter, onHeadersReceivedCallback)
  Protocol.handle(session.protocol, Platform.scheme, HandleRequest.handleRequest)
  return session
}
