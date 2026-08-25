import { BrowserWindow, type WebContentsView } from 'electron'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as UtilityProcessState from '../UtilityProcessState/UtilityProcessState.ts'

const getWebContentsViewName = (url: string): string => {
  if (URL.canParse(url)) {
    const { hostname } = new URL(url)
    if (hostname) {
      return `renderer (webcontentsview, ${hostname})`
    }
  }
  return 'renderer (webcontentsview)'
}

export const createPidMap = () => {
  const browserWindows = BrowserWindow.getAllWindows()
  const webContentsViews = ElectronWebContentsViewState.getAll()
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
  }
  for (const value of webContentsViews) {
    const { webContents } = (value as { readonly view: WebContentsView }).view
    const pid = webContents.getOSProcessId()
    pidWindowMap[pid] = getWebContentsViewName(webContents.getURL())
  }
  for (const [pid, value] of utilityProcesses) {
    // @ts-ignore
    pidWindowMap[pid] = value.name
  }
  return pidWindowMap
}
