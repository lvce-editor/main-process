import { CommandNotFoundError } from '../CommandNotFoundError/CommandNotFoundError.ts'
import * as ModuleId from '../ModuleId/ModuleId.ts'

const getPrefix = (commandId) => {
  return commandId.slice(0, commandId.indexOf('.'))
}

export const getModuleId = (commandId) => {
  const prefix = getPrefix(commandId)
  switch (prefix) {
    case 'App':
    case 'ElectronApp':
      return ModuleId.App
    case 'AppWindow':
      return ModuleId.AppWindow
    case 'Beep':
      return ModuleId.Beep
    case 'Crash':
      return ModuleId.Crash
    case 'CreateMessagePort':
      return ModuleId.CreateMessagePort
    case 'CreatePidMap':
      return ModuleId.CreatePidMap
    case 'DesktopCapturer':
      return ModuleId.DesktopCapturer
    case 'ElectronApplicationMenu':
      return ModuleId.ElectronApplicationMenu
    case 'ElectronBeep':
      return ModuleId.Beep
    case 'ElectronBrowserView':
      return ModuleId.ElectronBrowserView
    case 'ElectronBrowserViewQuickPick':
      return ModuleId.ElectronBrowserViewQuickPick
    case 'ElectronBrowserViewSuggestions':
      return ModuleId.ElectronBrowserViewSuggestions
    case 'ElectronClipBoard':
      return ModuleId.ElectronClipBoard
    case 'ElectronContentTracing':
      return ModuleId.ElectronContentTracing
    case 'ElectronContextMenu':
      return ModuleId.ElectronContextMenu
    case 'ElectronDeveloper':
      return ModuleId.Developer
    case 'ElectronDialog':
      return ModuleId.Dialog
    case 'ElectronNet':
      return ModuleId.ElectronNet
    case 'ElectronNetLog':
      return ModuleId.ElectronNetLog
    case 'ElectronPowerSaveBlocker':
      return ModuleId.ElectronPowerSaveBlocker
    case 'ElectronSafeStorage':
      return ModuleId.ElectronSafeStorage
    case 'ElectronScreen':
      return ModuleId.ElectronScreen
    case 'ElectronSession':
      return ModuleId.ElectronSession
    case 'ElectronShell':
      return ModuleId.ElectronShell
    case 'ElectronWebContents':
      return ModuleId.ElectronWebContents
    case 'ElectronWebContentsView':
      return ModuleId.ElectronWebContentsView
    case 'ElectronWebContentsViewFunctions':
      return ModuleId.ElectronWebContentsViewFunctions
    case 'ElectronWindow':
      return ModuleId.Window
    case 'ElectronWindowProcessExplorer':
      return ModuleId.ElectronWindowProcessExplorer
    case 'Exit':
      return ModuleId.Exit
    case 'GetWindowId':
      return ModuleId.GetWindowId
    case 'HandleElectronMessagePort':
      return ModuleId.HandleElectronMessagePort
    case 'IpcParent':
      return ModuleId.IpcParent
    case 'OpenExternal':
      return ModuleId.OpenExternal
    case 'Platform':
      return ModuleId.Platform
    case 'Process':
      return ModuleId.Process
    case 'TemporaryMessagePort':
      return ModuleId.TemporaryMessagePort
    case 'Trash':
      return ModuleId.Trash
    default:
      throw new CommandNotFoundError(commandId)
  }
}
