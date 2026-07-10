import { BrowserWindow } from 'electron'

const gpuInfoUrl = 'chrome://gpu'
let gpuInfoWindow: BrowserWindow | undefined

export const open = async (): Promise<void> => {
  if (gpuInfoWindow) {
    gpuInfoWindow.focus()
    return
  }
  gpuInfoWindow = new BrowserWindow({
    height: 800,
    title: 'GPU Internals',
    webPreferences: {
      sandbox: true,
      spellcheck: false,
    },
    width: 1200,
  })
  const currentGpuInfoWindow = gpuInfoWindow
  gpuInfoWindow.once('closed', () => {
    if (gpuInfoWindow === currentGpuInfoWindow) {
      gpuInfoWindow = undefined
    }
  })
  gpuInfoWindow.setMenuBarVisibility(false)
  await gpuInfoWindow.loadURL(gpuInfoUrl)
}
