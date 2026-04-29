import { join } from 'node:path'

export const getElectronPath = (electronPackagePath, platform) => {
  switch (platform) {
    case 'darwin':
      return join(electronPackagePath, 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron')
    case 'linux':
      return join(electronPackagePath, 'dist', 'electron')
    case 'win32':
      return join(electronPackagePath, 'dist', 'electron.exe')
    default:
      throw new Error(`Unsupported platform ${platform}`)
  }
}
