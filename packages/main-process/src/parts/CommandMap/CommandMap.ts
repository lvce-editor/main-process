import * as AppWindow from '../AppWindow/AppWindow.ts'
import * as Beep from '../Beep/Beep.ts'
import * as Crash from '../Crash/Crash.ts'
import * as ElectronBeep from '../ElectronBeep/ElectronBeep.ts'
import * as ElectronContentTracing from '../ElectronContentTracing/ElectronContentTracing.ts'
import * as ElectronDeveloper from '../ElectronDeveloper/ElectronDeveloper.ts'
import * as ElectronDialog from '../ElectronDialog/ElectronDialog.ts'
import * as ElectronNetLog from '../ElectronNetLog/ElectronNetLog.ts'
import * as ElectronPowerSaveBlocker from '../ElectronPowerSaveBlocker/ElectronPowerSaveBlocker.ts'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as ElectronShell from '../ElectronShell/ElectronShell.ts'
import * as ElectronWindow from '../ElectronWindow/ElectronWindow.ts'
import * as ElectronWindowProcessExplorer from '../ElectronWindowProcessExplorer/ElectronWindowProcessExplorer.ts'
import * as OpenExternal from '../OpenExternal/OpenExternal.ts'

export const commandMap = {
  'AppWindow.createAppWindow': AppWindow.createAppWindow,
  'Beep.beep': Beep.beep,
  'Crash.crashMainProcess': Crash.crashMainProcess,
  'ElectronBeep.beep': ElectronBeep.beep,
  'ElectronContentTracing.startRecording': ElectronContentTracing.startRecording,
  'ElectronContentTracing.stopRecording': ElectronContentTracing.stopRecording,
  'ElectronDeveloper.crashMainProcess': ElectronDeveloper.crashMainProcess,
  'ElectronDeveloper.getPerformanceEntries': ElectronDeveloper.getPerformanceEntries,
  'ElectronDialog.showMessageBox': ElectronDialog.showMessageBox,
  'ElectronDialog.showOpenDialog': ElectronDialog.showOpenDialog,
  'ElectronNetLog.startLogging': ElectronNetLog.startLogging,
  'ElectronNetLog.stopLogging': ElectronNetLog.stopLogging,
  'ElectronPowerSaveBlocker.start': ElectronPowerSaveBlocker.start,
  'ElectronPowerSaveBlocker.stop': ElectronPowerSaveBlocker.stop,
  'ElectronSafeStorage.decrypt': ElectronSafeStorage.decrypt,
  'ElectronSafeStorage.encrypt': ElectronSafeStorage.encrypt,
  'ElectronSafeStorage.isEncryptionAvailable': ElectronSafeStorage.isEncryptionAvailable,
  'ElectronShell.beep': ElectronBeep.beep,
  'ElectronShell.openExternal': OpenExternal.openExternal,
  'ElectronShell.openPath': ElectronShell.openPath,
  'ElectronShell.showItemInFolder': ElectronShell.showItemInFolder,
  'ElectronWindow.executeWebContentsFunction': ElectronWindow.executeWebContentsFunction,
  'ElectronWindow.executeWindowFunction': ElectronWindow.executeWindowFunction,
  'ElectronWindow.getFocusedWindowId': ElectronWindow.getFocusedWindowId,
  'ElectronWindow.getZoom': ElectronWindow.getZoom,
  'ElectronWindowProcessExplorer.open2': ElectronWindowProcessExplorer.open2,
}
