import * as ApplicationMemoryUsage from '../ApplicationMemoryUsage/ApplicationMemoryUsage.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as Locale from '../Locale/Locale.ts'
import * as Platform from '../Platform/Platform.ts'
import * as Sandbox from '../Sandbox/Sandbox.ts'

const partitionAllocMemoryReclaimerFeature = 'PartitionAllocMemoryReclaimer'
const partitionAllocMemoryReclaimerInterval = '1800s'
const partitionAllocMemoryReclaimerFeatureWithInterval = `${partitionAllocMemoryReclaimerFeature}:interval/${partitionAllocMemoryReclaimerInterval}`

const getFeatureName = (feature) => feature.split(/[:<]/, 1)[0].trim()

const getEnabledFeatures = () => {
  let existingFeatures = ElectronApp.getCommandLineSwitchValue('enable-features')
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)
  const disabledFeatures = ElectronApp.getCommandLineSwitchValue('disable-features')
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean)
  if (disabledFeatures.some((feature) => getFeatureName(feature) === partitionAllocMemoryReclaimerFeature)) {
    return existingFeatures.join(',')
  }
  const reclaimerIndices = existingFeatures.flatMap((feature, index) =>
    getFeatureName(feature) === partitionAllocMemoryReclaimerFeature ? [index] : [],
  )
  if (reclaimerIndices.length === 0) {
    return [...existingFeatures, partitionAllocMemoryReclaimerFeatureWithInterval].join(',')
  }
  const reclaimerIndex = reclaimerIndices[0]
  const explicitReclaimerIndex = reclaimerIndices.findLast((index) => existingFeatures[index].includes(':'))
  const existingReclaimerFeature = existingFeatures[explicitReclaimerIndex ?? reclaimerIndex]
  const reclaimerFeature = existingReclaimerFeature.includes(':')
    ? existingReclaimerFeature
    : `${existingReclaimerFeature}:interval/${partitionAllocMemoryReclaimerInterval}`
  existingFeatures = existingFeatures.filter((feature) => getFeatureName(feature) !== partitionAllocMemoryReclaimerFeature)
  existingFeatures.splice(reclaimerIndex, 0, reclaimerFeature)
  return existingFeatures.join(',')
}

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
  const enabledFeatures = getEnabledFeatures()
  if (enabledFeatures) {
    ElectronApp.appendCommandLineSwitch('enable-features', enabledFeatures)
  }
  if (memoryUsage === ApplicationMemoryUsage.Reduce) {
    ElectronApp.appendCommandLineSwitch('in-process-gpu', undefined)
    ElectronApp.appendCommandLineSwitch('enable-low-end-device-mode', undefined)
    ElectronApp.appendCommandLineSwitch('disable-features', getDisabledFeatures())
    ElectronApp.appendCommandLineSwitch('num-raster-threads', '1')
  }
  Locale.setLocale('en')
}
