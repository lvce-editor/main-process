import * as AppWindow from '../AppWindow/AppWindow.ts'
import * as Beep from '../Beep/Beep.ts'
import * as Crash from '../Crash/Crash.ts'
import * as CreateMessagePort from '../CreateMessagePort/CreateMessagePort.ts'
import * as CreatePidMap from '../CreatePidMap/CreatePidMap.ts'
import * as CreateUtilityProcessRpc from '../CreateUtilityProcessRpc/CreateUtilityProcessRpc.ts'
import * as DesktopCapturer from '../DesktopCapturer/DesktopCapturer.ts'
import * as ElectronApplicationMenu from '../ElectronApplicationMenu/ElectronApplicationMenu.ts'
import * as ElectronBeep from '../ElectronBeep/ElectronBeep.ts'
import * as ElectronContentTracing from '../ElectronContentTracing/ElectronContentTracing.ts'
import * as ElectronContextMenu from '../ElectronContextMenu/ElectronContextMenu.ts'
import * as ElectronDeveloper from '../ElectronDeveloper/ElectronDeveloper.ts'
import * as ElectronDialog from '../ElectronDialog/ElectronDialog.ts'
import * as ElectronNet from '../ElectronNet/ElectronNet.ts'
import * as ElectronNetLog from '../ElectronNetLog/ElectronNetLog.ts'
import * as ElectronPowerSaveBlocker from '../ElectronPowerSaveBlocker/ElectronPowerSaveBlocker.ts'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as ElectronScreen from '../ElectronScreen/ElectronScreen.ts'
import * as ElectronSession from '../ElectronSession/ElectronSession.ts'
import * as ElectronShell from '../ElectronShell/ElectronShell.ts'
import * as ElectronWebContents from '../ElectronWebContents/ElectronWebContents.ts'
import * as ElectronWebContentsView from '../ElectronWebContentsView/ElectronWebContentsView.ts'
import * as ElectronWebContentsViewFunctions from '../ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts'
import * as ElectronWindow from '../ElectronWindow/ElectronWindow.ts'
import * as ElectronWindowProcessExplorer from '../ElectronWindowProcessExplorer/ElectronWindowProcessExplorer.ts'
import * as Exit from '../Exit/Exit.ts'
import * as GetWindowId from '../GetWindowId/GetWindowId.ts'
import * as HandleElectronMessagePort from '../HandleElectronMessagePort/HandleElectronMessagePort.ts'
import * as IpcParent from '../IpcParent/IpcParent.ts'
import * as OpenExternal from '../OpenExternal/OpenExternal.ts'
import * as Process from '../Process/Process.ts'
import * as TemporaryMessagePort from '../TemporaryMessagePort/TemporaryMessagePort.ts'
import * as Trash from '../Trash/Trash.ts'

export const commandMap = {
  'AppWindow.createAppWindow': AppWindow.createAppWindow,
  'Beep.beep': Beep.beep,
  'Crash.crashMainProcess': Crash.crashMainProcess,
  'CreateMessagePort.createMessagePort': CreateMessagePort.createMessagePort,
  'CreatePidMap.createPidMap': CreatePidMap.createPidMap,
  'CreateUtilityProcessRpc.createUtilityProcessRpc': CreateUtilityProcessRpc.createUtilityProcessRpc,
  'DesktopCapturer.getSources': DesktopCapturer.getSources,
  'ElectronApplicationMenu.setItems': ElectronApplicationMenu.setItems,
  'ElectronBeep.beep': ElectronBeep.beep,
  'ElectronContentTracing.startRecording': ElectronContentTracing.startRecording,
  'ElectronContentTracing.stopRecording': ElectronContentTracing.stopRecording,
  'ElectronContextMenu.openContextMenu': ElectronContextMenu.openContextMenu,
  'ElectronDeveloper.crashMainProcess': ElectronDeveloper.crashMainProcess,
  'ElectronDeveloper.getPerformanceEntries': ElectronDeveloper.getPerformanceEntries,
  'ElectronDialog.showMessageBox': ElectronDialog.showMessageBox,
  'ElectronDialog.showOpenDialog': ElectronDialog.showOpenDialog,
  'ElectronNet.getJson': ElectronNet.getJson,
  'ElectronNetLog.startLogging': ElectronNetLog.startLogging,
  'ElectronNetLog.stopLogging': ElectronNetLog.stopLogging,
  'ElectronPowerSaveBlocker.start': ElectronPowerSaveBlocker.start,
  'ElectronPowerSaveBlocker.stop': ElectronPowerSaveBlocker.stop,
  'ElectronSafeStorage.decrypt': ElectronSafeStorage.decrypt,
  'ElectronSafeStorage.encrypt': ElectronSafeStorage.encrypt,
  'ElectronSafeStorage.isEncryptionAvailable': ElectronSafeStorage.isEncryptionAvailable,
  'ElectronScreen.getBounds': ElectronScreen.getBounds,
  'ElectronScreen.getHeight': ElectronScreen.getHeight,
  'ElectronScreen.getWidth': ElectronScreen.getWidth,
  'ElectronSession.registerWebviewProtocol': ElectronSession.registerWebviewProtocol,
  'ElectronShell.beep': ElectronBeep.beep,
  'ElectronShell.openExternal': OpenExternal.openExternal,
  'ElectronShell.openPath': ElectronShell.openPath,
  'ElectronShell.showItemInFolder': ElectronShell.showItemInFolder,
  'ElectronWebContents.callFunction': ElectronWebContents.callFunction,
  'ElectronWebContents.dispose': ElectronWebContents.dispose,
  'ElectronWebContents.getStats': ElectronWebContents.getStats,
  'ElectronWebContentsView.attachEventListeners': ElectronWebContentsView.attachEventListeners,
  'ElectronWebContentsView.createWebContentsView': ElectronWebContentsView.createWebContentsView,
  'ElectronWebContentsView.disposeWebContentsView': ElectronWebContentsView.disposeWebContentsView,
  'ElectronWebContentsViewFunctions.addToWindow': ElectronWebContentsViewFunctions.addToWindow,
  'ElectronWebContentsViewFunctions.backward': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.backward),
  'ElectronWebContentsViewFunctions.cancelNavigation': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.cancelNavigation,
  ),
  'ElectronWebContentsViewFunctions.copyImageAt': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.copyImageAt,
  ),
  'ElectronWebContentsViewFunctions.executeJavaScript': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.executeJavaScript,
  ),
  'ElectronWebContentsViewFunctions.focus': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.focus),
  'ElectronWebContentsViewFunctions.forward': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.forward),
  'ElectronWebContentsViewFunctions.getDomTree': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.getDomTree),
  'ElectronWebContentsViewFunctions.getStats': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.getStats),
  'ElectronWebContentsViewFunctions.hide': ElectronWebContentsViewFunctions.hide,
  'ElectronWebContentsViewFunctions.insertCss': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.insertCss),
  'ElectronWebContentsViewFunctions.insertJavaScript': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.executeJavaScript,
  ),
  'ElectronWebContentsViewFunctions.inspectElement': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.inspectElement,
  ),
  'ElectronWebContentsViewFunctions.openDevtools': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.openDevtools,
  ),
  'ElectronWebContentsViewFunctions.reload': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.wrapBrowserViewCommand(ElectronWebContentsViewFunctions.reload),
  ),
  'ElectronWebContentsViewFunctions.resizeBrowserView': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.resizeBrowserView,
  ),
  'ElectronWebContentsViewFunctions.setBackgroundColor': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.setBackgroundColor,
  ),
  'ElectronWebContentsViewFunctions.setFallthroughKeyBindings': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.setFallThroughKeyBindings,
  ),
  'ElectronWebContentsViewFunctions.setIframeSrc': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.setIframeSrc,
  ),
  'ElectronWebContentsViewFunctions.setIframeSrcFallback': ElectronWebContentsViewFunctions.wrapBrowserViewCommand(
    ElectronWebContentsViewFunctions.setIframeSrcFallback,
  ),
  'ElectronWebContentsViewFunctions.show': ElectronWebContentsViewFunctions.show,
  'ElectronWindow.executeWebContentsFunction': ElectronWindow.executeWebContentsFunction,
  'ElectronWindow.executeWindowFunction': ElectronWindow.executeWindowFunction,
  'ElectronWindow.getFocusedWindowId': ElectronWindow.getFocusedWindowId,
  'ElectronWindow.getZoom': ElectronWindow.getZoom,
  'ElectronWindowProcessExplorer.open2': ElectronWindowProcessExplorer.open2,
  'Exit.exit': Exit.exit,
  'GetWindowId.getWindowId': GetWindowId.getWindowId,
  'HandleElectronMessagePort.handleElectronMessagePort': HandleElectronMessagePort.handleElectronMessagePort,
  'IpcParent.create': IpcParent.create,
  'OpenExternal.openExternal': OpenExternal.openExternal,
  'Process.getArgv': Process.getArgv,
  'Process.getChromeVersion': Process.getChromeVersion,
  'Process.getElectronVersion': Process.getElectronVersion,
  'Process.getNodeVersion': Process.getNodeVersion,
  'Process.getPid': Process.getPid,
  'Process.getV8Version': Process.getV8Version,
  'TemporaryMessagePort.createPortTuple': TemporaryMessagePort.createPortTuple,
  'TemporaryMessagePort.dispose': TemporaryMessagePort.dispose,
  'TemporaryMessagePort.sendTo': TemporaryMessagePort.sendTo,
  'TemporaryMessagePort.sendTo2': TemporaryMessagePort.sendTo2,
  'Trash.trash': Trash.trash,
}
