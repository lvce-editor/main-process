import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Locale from '../Locale/Locale.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Sandbox from '../Sandbox/Sandbox.ts'

export const enable = (parsedCliArgs) => {
  // command line switches
  if (parsedCliArgs.sandbox) {
    Sandbox.enableSandbox()
  } else {
    // see https://github.com/microsoft/vscode/issues/151187#issuecomment-1221475319
    if (Platform.isLinux) {
      // @ts-ignore
      ElectronApp.appendCommandLineSwitch('--disable-gpu-sandbox')
    }
  }
  Locale.setLocale('en')
}
