import * as Electron from 'electron'
import * as ElectronBrowserViewAdBlock from '../ElectronBrowserViewAdBlock/ElectronBrowserViewAdBlock.ts'
import * as ElectronPermissionType from '../ElectronPermissionType/ElectronPermissionType.ts'

const state = {
  /**
   * @type {import('electron').Session|undefined}
   */
  session: undefined,
}

const isAllowedPermission = (permission: string): boolean => {
  switch (permission) {
    case ElectronPermissionType.ClipBoardRead:
    case ElectronPermissionType.ClipBoardSanitizedWrite:
    case ElectronPermissionType.WindowPlacement:
    case ElectronPermissionType.FullScreen:
    case ElectronPermissionType.GeoLocation:
      return true
    default:
      return false
  }
}

const handlePermissionRequest = (webContents, permission, callback, details): void => {
  callback(isAllowedPermission(permission))
}

const handlePermissionCheck = (webContents, permission, origin, details): boolean => {
  return isAllowedPermission(permission)
}

const createSession = () => {
  const sessionId = `persist:browserView`
  const session = Electron.session.fromPartition(sessionId, {
    cache: true,
  })
  session.setPermissionRequestHandler(handlePermissionRequest)
  session.setPermissionCheckHandler(handlePermissionCheck)
  session.webRequest.onBeforeRequest(ElectronBrowserViewAdBlock.filter, ElectronBrowserViewAdBlock.handleBeforeRequest)
  // session.webRequest.addSessionChromeExtensions(session)
  return session
}

export const getSession = () => {
  // @ts-ignore
  state.session ||= createSession()
  return state.session
}
