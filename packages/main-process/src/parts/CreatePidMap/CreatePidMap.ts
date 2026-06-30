import { BrowserWindow } from 'electron'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

export const createPidMap = () => {
  const browserWindows = BrowserWindow.getAllWindows()
  const utilityProcesses = UtilityProcessState.getAll()
  const pidWindowMap = Object.create(null)
  for (const browserWindow of browserWindows) {
    const { webContents } = browserWindow
    const pid = webContents.getOSProcessId()
    pidWindowMap[pid] = 'renderer'
    const { devToolsWebContents } = webContents
    if (devToolsWebContents) {
      const pid = devToolsWebContents.getOSProcessId()
      pidWindowMap[pid] = 'chrome-devtools'
    }
    const views = browserWindow.getBrowserViews() // TODO use webcontents views
    for (const view of views) {
      const viewWebContents = view.webContents
      const pid = viewWebContents.getOSProcessId()
      const displayName = `browser-view-${viewWebContents.id}`
      pidWindowMap[pid] = displayName
    }
  }
  for (const [pid, value] of utilityProcesses) {
    // @ts-ignore
    pidWindowMap[pid] = value.name
  }
  return pidWindowMap
}
