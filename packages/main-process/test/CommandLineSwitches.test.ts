import { beforeEach, expect, jest, test } from '@jest/globals'

let enabledFeatures = 'SomeExistingFeature'
let disabledFeatures = 'SomeExistingDisabledFeature'

const electronApp = {
  commandLine: {
    appendSwitch: jest.fn(),
    getSwitchValue: jest.fn((switchName) => (switchName === 'enable-features' ? enabledFeatures : disabledFeatures)),
  },
  enableSandbox: jest.fn(),
}

jest.unstable_mockModule('electron', () => {
  return {
    app: electronApp,
  }
})

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => {
  return {
    isLinux: true,
  }
})

const CommandLineSwitches = await import('../src/parts/CommandLineSwitches/CommandLineSwitches.ts')
const ParseCliArgs = await import('../src/parts/ParseCliArgs/ParseCliArgs.ts')

beforeEach(() => {
  jest.clearAllMocks()
  enabledFeatures = 'SomeExistingFeature'
  disabledFeatures = 'SomeExistingDisabledFeature'
})

test('enables the Chromium sandbox by default', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.enableSandbox).toHaveBeenCalledTimes(1)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(2)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/1800s',
  )
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('uses the default interval for an explicitly enabled reclaimer without a parameter', () => {
  enabledFeatures = 'SomeExistingFeature,PartitionAllocMemoryReclaimer'
  disabledFeatures = ''
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/1800s',
  )
})

test('preserves an explicitly configured reclaimer interval', () => {
  enabledFeatures = 'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/32s'
  disabledFeatures = ''
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/32s',
  )
})

test('resolves duplicate reclaimer entries without overriding an explicit interval', () => {
  enabledFeatures = 'PartitionAllocMemoryReclaimer,SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/32s'
  disabledFeatures = ''
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'PartitionAllocMemoryReclaimer:interval/32s,SomeExistingFeature',
  )
})

test('does not enable a reclaimer explicitly disabled by the user', () => {
  enabledFeatures = ''
  disabledFeatures = 'PartitionAllocMemoryReclaimer'
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.commandLine.appendSwitch).not.toHaveBeenCalledWith('enable-features', expect.anything())
})

test('disables the GPU sandbox only when no-sandbox is requested', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '--no-sandbox', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs)

  expect(electronApp.enableSandbox).not.toHaveBeenCalled()
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(3)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('--disable-gpu-sandbox', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('enables reduced-memory switches and preserves existing disabled features', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs, 'reduce')

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('in-process-gpu', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('enable-low-end-device-mode', undefined)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'disable-features',
    'SomeExistingDisabledFeature,BackForwardCache,SpareRendererForSitePerProcess',
  )
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/1800s',
  )
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('num-raster-threads', '1')
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})

test('does not add reduced-memory switches in default mode', () => {
  const parsedCliArgs = ParseCliArgs.parseCliArgs(['/usr/lib/lvce/lvce', '/test/'])

  CommandLineSwitches.enable(parsedCliArgs, 'default')

  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledTimes(2)
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith(
    'enable-features',
    'SomeExistingFeature,PartitionAllocMemoryReclaimer:interval/1800s',
  )
  expect(electronApp.commandLine.appendSwitch).toHaveBeenCalledWith('lang', 'en')
})
