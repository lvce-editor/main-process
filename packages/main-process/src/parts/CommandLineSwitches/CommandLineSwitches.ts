import * as ApplicationMemoryUsage from '../ApplicationMemoryUsage/ApplicationMemoryUsage.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Locale from '../Locale/Locale.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Sandbox from '../Sandbox/Sandbox.ts'

const getDisabledFeatures = () => {
  const existingFeatures = ElectronApp.getCommandLineSwitchValue('disable-features')
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)
  return [...new Set([...existingFeatures, 'BackForwardCache', 'SpareRendererForSitePerProcess'])].join(',')
}

export const enable = (parsedCliArgs, memoryUsage = ApplicationMemoryUsage.Default) => {
  // command line switches
  if (parsedCliArgs.sandbox) {
    Sandbox.enableSandbox()
  } else {
    // The GPU sandbox must also be disabled when Chromium's sandbox was explicitly disabled.
    // See https://github.com/microsoft/vscode/issues/151187#issuecomment-1221475319
    if (Platform.isLinux) {
      // @ts-ignore
      ElectronApp.appendCommandLineSwitch('--disable-gpu-sandbox')
    }
  }
  if (memoryUsage === ApplicationMemoryUsage.Reduce) {
    ElectronApp.appendCommandLineSwitch('in-process-gpu')
    ElectronApp.appendCommandLineSwitch('enable-low-end-device-mode')
    ElectronApp.appendCommandLineSwitch('disable-features', getDisabledFeatures())
    ElectronApp.appendCommandLineSwitch('num-raster-threads', '1')
  }
  Locale.setLocale('en')
}
