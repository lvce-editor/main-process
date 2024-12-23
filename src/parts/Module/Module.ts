import * as ModuleId from '../ModuleId/ModuleId.ts'
import { ModuleNotFoundError } from '../ModuleNotFoundError/ModuleNotFoundError.ts'

export const load = async (moduleId) => {
  switch (moduleId) {
    case ModuleId.App:
      return import('../App/App.ipc.ts')
    case ModuleId.AppWindow:
      return import('../AppWindow/AppWindow.ipc.ts')
    case ModuleId.Beep:
      return import('../Beep/Beep.ipc.ts')
    case ModuleId.Crash:
      return import('../Crash/Crash.ipc.ts')
    case ModuleId.CreateMessagePort:
      return import('../CreateMessagePort/CreateMessagePort.ipc.ts')
    case ModuleId.CreatePidMap:
      return import('../CreatePidMap/CreatePidMap.ipc.ts')
    case ModuleId.DesktopCapturer:
      return import('../DesktopCapturer/DesktopCapturer.ipc.ts')
    case ModuleId.ElectronApplicationMenu:
      return import('../ElectronApplicationMenu/ElectronApplicationMenu.ipc.ts')
    case ModuleId.ElectronClipBoard:
      return import('../ElectronClipBoard/ElectronClipBoard.ipc.ts')
    case ModuleId.ElectronContentTracing:
      return import('../ElectronContentTracing/ElectronContentTracing.ipc.ts')
    case ModuleId.ElectronContextMenu:
      return import('../ElectronContextMenu/ElectronContextMenu.ipc.ts')
    case ModuleId.Developer:
      return import('../ElectronDeveloper/ElectronDeveloper.ipc.ts')
    case ModuleId.Dialog:
      return import('../ElectronDialog/ElectronDialog.ipc.ts')
    case ModuleId.ElectronNet:
      return import('../ElectronNet/ElectronNet.ipc.ts')
    case ModuleId.ElectronNetLog:
      return import('../ElectronNetLog/ElectronNetLog.ipc.ts')
    case ModuleId.ElectronPowerSaveBlocker:
      return import('../ElectronPowerSaveBlocker/ElectronPowerSaveBlocker.ipc.ts')
    case ModuleId.ElectronSafeStorage:
      return import('../ElectronSafeStorage/ElectronSafeStorage.ipc.ts')
    case ModuleId.ElectronShell:
      return import('../ElectronShell/ElectronShell.ipc.ts')
    case ModuleId.Window:
      return import('../ElectronWindow/ElectronWindow.ipc.ts')
    case ModuleId.ElectronWindowProcessExplorer:
      return import('../ElectronWindowProcessExplorer/ElectronWindowProcessExplorer.ipc.ts')
    case ModuleId.IpcParent:
      return import('../IpcParent/IpcParent.ipc.ts')
    case ModuleId.OpenExternal:
      return import('../OpenExternal/OpenExternal.ipc.ts')
    case ModuleId.Process:
      return import('../Process/Process.ipc.ts')
    case ModuleId.Exit:
      return import('../Exit/Exit.ipc.ts')
    case ModuleId.ElectronScreen:
      return import('../ElectronScreen/ElectronScreen.ipc.ts')
    case ModuleId.TemporaryMessagePort:
      return import('../TemporaryMessagePort/TemporaryMessagePort.ipc.ts')
    case ModuleId.ElectronWebContents:
      return import('../ElectronWebContents/ElectronWebContents.ipc.ts')
    case ModuleId.ElectronWebContentsView:
      return import('../ElectronWebContentsView/ElectronWebContentsView.ipc.ts')
    case ModuleId.ElectronWebContentsViewFunctions:
      return import('../ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ipc.ts')
    case ModuleId.HandleElectronMessagePort:
      return import('../HandleElectronMessagePort/HandleElectronMessagePort.ipc.ts')
    case ModuleId.GetWindowId:
      return import('../GetWindowId/GetWindowId.ipc.ts')
    case ModuleId.ElectronSession:
      return import('../ElectronSession/ElectronSession.ipc.ts')
    case ModuleId.Trash:
      return import('../Trash/Trash.ipc.ts')
    default:
      throw new ModuleNotFoundError(moduleId)
  }
}
