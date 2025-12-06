import * as ElectronPermissionType from '../ElectronPermissionType/ElectronPermissionType.ts'
import * as Logger from '../Logger/Logger.ts'

const isAllowedPermission = (permission) => {
  switch (permission) {
    case ElectronPermissionType.ClipBoardRead:
    case ElectronPermissionType.ClipBoardSanitizedWrite:
    case ElectronPermissionType.FullScreen:
    case ElectronPermissionType.Media:
    case ElectronPermissionType.OpenExternal:
    case ElectronPermissionType.WindowPlacement:
      return true
    default:
      return false
  }
}

export const handlePermissionRequest = (webContents, permission, callback, details) => {
  const isAllowed = isAllowedPermission(permission)
  if (!isAllowed) {
    Logger.info(`[main-process] blocked permission request for ${permission}`)
  }
  callback(isAllowed)
}

export const handlePermissionCheck = (webContents, permission, origin, details) => {
  const isAllowed = isAllowedPermission(permission)
  return isAllowed
}
