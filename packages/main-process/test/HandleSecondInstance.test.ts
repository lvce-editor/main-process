import { afterEach, expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/Cli/Cli.ts', () => ({
  canHandleFastCliArgs: jest.fn(() => 0),
  handleFastCliArgs: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/HandleElectronReady/HandleElectronReady.ts', () => ({
  handleReady: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/ParseCliArgs/ParseCliArgs.ts', () => ({
  parseCliArgs: jest.fn(() => ({ _: ['/workspace'] })),
}))

jest.unstable_mockModule('../src/parts/ReuseAppWindow/ReuseAppWindow.ts', () => ({
  reuseAppWindow: jest.fn(() => true),
  openFileInAppWindow: jest.fn(() => true),
}))

const HandleSecondInstance = await import('../src/parts/HandleSecondInstance/HandleSecondInstance.ts')
const HandleElectronReady = await import('../src/parts/HandleElectronReady/HandleElectronReady.ts')
const ParseCliArgs = await import('../src/parts/ParseCliArgs/ParseCliArgs.ts')
const ReuseAppWindow = await import('../src/parts/ReuseAppWindow/ReuseAppWindow.ts')

afterEach(() => {
  jest.clearAllMocks()
})

test('handleSecondInstance reuses the existing window when requested', async () => {
  // @ts-ignore
  ParseCliArgs.parseCliArgs.mockReturnValue({ _: ['/workspace'], reuse: true })

  await HandleSecondInstance.handleSecondInstance({}, [], '/home/test', ['/usr/bin/lvce', '-r', '/workspace'])

  expect(ReuseAppWindow.reuseAppWindow).toHaveBeenCalledWith({ _: ['/workspace'], reuse: true }, '/home/test')
  expect(HandleElectronReady.handleReady).not.toHaveBeenCalled()
})

test('handleSecondInstance opens a new window when reuse is unavailable', async () => {
  // @ts-ignore
  ParseCliArgs.parseCliArgs.mockReturnValue({ _: ['/workspace'], reuse: true })
  // @ts-ignore
  ReuseAppWindow.reuseAppWindow.mockResolvedValue(false)

  await HandleSecondInstance.handleSecondInstance({}, [], '/home/test', ['/usr/bin/lvce', '-r', '/workspace'])

  expect(HandleElectronReady.handleReady).toHaveBeenCalledWith({ _: ['/workspace'], reuse: true }, '/home/test')
})

test('handleSecondInstance opens a file in an existing window by default', async () => {
  // @ts-ignore
  ParseCliArgs.parseCliArgs.mockReturnValue({ _: ['/workspace/file.txt'] })

  await HandleSecondInstance.handleSecondInstance({}, [], '/home/test', ['/usr/bin/lvce', '/workspace/file.txt'])

  expect(ReuseAppWindow.openFileInAppWindow).toHaveBeenCalledWith({ _: ['/workspace/file.txt'] }, '/home/test')
  expect(HandleElectronReady.handleReady).not.toHaveBeenCalled()
})

test('handleSecondInstance starts normally when no existing window can open a file', async () => {
  // @ts-ignore
  ParseCliArgs.parseCliArgs.mockReturnValue({ _: ['/workspace/file.txt'] })
  // @ts-ignore
  ReuseAppWindow.openFileInAppWindow.mockResolvedValue(false)

  await HandleSecondInstance.handleSecondInstance({}, [], '/home/test', ['/usr/bin/lvce', '/workspace/file.txt'])

  expect(HandleElectronReady.handleReady).toHaveBeenCalledWith({ _: ['/workspace/file.txt'] }, '/home/test')
})
