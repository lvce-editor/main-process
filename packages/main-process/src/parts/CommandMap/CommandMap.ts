import * as AppWindow from '../AppWindow/AppWindow.ts'
import * as Beep from '../Beep/Beep.ts'
import * as Crash from '../Crash/Crash.ts'
import * as CreatePidMap from '../CreatePidMap/CreatePidMap.ts'
import * as ElectronBeep from '../ElectronBeep/ElectronBeep.ts'
import * as ElectronContentTracing from '../ElectronContentTracing/ElectronContentTracing.ts'
import * as ElectronDeveloper from '../ElectronDeveloper/ElectronDeveloper.ts'
import * as ElectronDialog from '../ElectronDialog/ElectronDialog.ts'
import * as ElectronNetLog from '../ElectronNetLog/ElectronNetLog.ts'
import * as ElectronPowerSaveBlocker from '../ElectronPowerSaveBlocker/ElectronPowerSaveBlocker.ts'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as ElectronScreen from '../ElectronScreen/ElectronScreen.ts'
import * as ElectronShell from '../ElectronShell/ElectronShell.ts'
import * as ElectronWindow from '../ElectronWindow/ElectronWindow.ts'
import * as ElectronWindowProcessExplorer from '../ElectronWindowProcessExplorer/ElectronWindowProcessExplorer.ts'
import * as Exit from '../Exit/Exit.ts'
import * as GetWindowId from '../GetWindowId/GetWindowId.ts'
import * as HandleElectronMessagePort from '../HandleElectronMessagePort/HandleElectronMessagePort.ts'
import * as OpenExternal from '../OpenExternal/OpenExternal.ts'
import * as Process from '../Process/Process.ts'
import * as TemporaryMessagePort from '../TemporaryMessagePort/TemporaryMessagePort.ts'
import * as Trash from '../Trash/Trash.ts'

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
  'CreatePidMap.createPidMap': CreatePidMap.createPidMap,
  'OpenExternal.openExternal': OpenExternal.openExternal,
  'Process.getArgv': Process.getArgv,
  'Process.getChromeVersion': Process.getChromeVersion,
  'Process.getElectronVersion': Process.getElectronVersion,
  'Process.getNodeVersion': Process.getNodeVersion,
  'Process.getPid': Process.getPid,
  'Process.getV8Version': Process.getV8Version,
  'Exit.exit': Exit.exit,
  'TemporaryMessagePort.createPortTuple': TemporaryMessagePort.createPortTuple,
  'TemporaryMessagePort.dispose': TemporaryMessagePort.dispose,
  'TemporaryMessagePort.sendTo': TemporaryMessagePort.sendTo,
  'Trash.trash': Trash.trash,
  'HandleElectronMessagePort.handleElectronMessagePort': HandleElectronMessagePort.handleElectronMessagePort,
  'ElectronScreen.getBounds': ElectronScreen.getBounds,
  'ElectronScreen.getWidth': ElectronScreen.getWidth,
  'ElectronScreen.getHeight': ElectronScreen.getHeight,
  'GetWindowId.getWindowId': GetWindowId.getWindowId,
}
