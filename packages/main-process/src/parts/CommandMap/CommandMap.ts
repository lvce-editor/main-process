import * as AppWindow from '../AppWindow/AppWindow.ts'
import * as Beep from '../Beep/Beep.ts'
import * as Crash from '../Crash/Crash.ts'
import * as ElectronDeveloper from '../ElectronDeveloper/ElectronDeveloper.ts'
import * as ElectronWindow from '../ElectronWindow/ElectronWindow.ts'
import * as ElectronWindowProcessExplorer from '../ElectronWindowProcessExplorer/ElectronWindowProcessExplorer.ts'

export const commandMap = {
  'Crash.crashMainProcess': Crash.crashMainProcess,
  'Beep.beep': Beep.beep,
  'ElectronWindow.executeWindowFunction': ElectronWindow.executeWindowFunction,
  'ElectronWindow.executeWebContentsFunction': ElectronWindow.executeWebContentsFunction,
  'ElectronWindow.getFocusedWindowId': ElectronWindow.getFocusedWindowId,
  'ElectronWindow.getZoom': ElectronWindow.getZoom,
  'ElectronDeveloper.crashMainProcess': ElectronDeveloper.crashMainProcess,
  'ElectronDeveloper.getPerformanceEntries': ElectronDeveloper.getPerformanceEntries,
  'AppWindow.createAppWindow': AppWindow.createAppWindow,
  'ElectronWindowProcessExplorer.open2': ElectronWindowProcessExplorer.open2,
}
