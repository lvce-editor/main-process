import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as HasPackageChanged from '../HasPackageChanged/HasPackageChanged.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const handleWindowAllClosed = async () => {
  if (HasPackageChanged.hasPackageChanged()) {
    // The old shared process may need lazy modules removed by the package update.
    // Finish closing locally, after Electron has completed this close event.
    setImmediate(() => ElectronApp.quit())
    return
  }
  await SharedProcess.send('HandleWindowAllClosed.handleWindowAllClosed')
}
