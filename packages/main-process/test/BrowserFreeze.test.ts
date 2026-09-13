import { beforeEach, expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts', () => ({ get: jest.fn() }))
const ViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')
const BrowserFreeze = await import('../src/parts/BrowserFreeze/BrowserFreeze.ts')

beforeEach(() => {
  jest.clearAllMocks()
})

const setup = () => {
  const contents = {
    debugger: { attach: jest.fn(), isAttached: () => true, on: jest.fn(), sendCommand: jest.fn<() => Promise<void>>().mockResolvedValue() },
    getURL: () => 'https://example.com',
    isAudioMuted: () => false,
    isCurrentlyAudible: () => false,
    isDestroyed: () => false,
    isDevToolsOpened: () => false,
    on: jest.fn(),
  }
  jest.mocked(ViewState.get).mockReturnValue({ view: { webContents: contents } })
  return contents
}

test('a show supersedes a queued freeze without sending a stale command', async () => {
  const contents = setup()
  const hidden = BrowserFreeze.setHidden(1, true, true)
  const shown = BrowserFreeze.resume(contents as never)
  await Promise.all([hidden, shown])
  expect(contents.debugger.sendCommand).not.toHaveBeenCalled()
})

test('activation during a pending freeze always sends active afterwards', async () => {
  const contents = setup()
  let finish!: () => void
  contents.debugger.sendCommand.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  const hidden = BrowserFreeze.setHidden(1, true, true)
  await Promise.resolve()
  const shown = BrowserFreeze.resume(contents as never)
  finish()
  await Promise.all([hidden, shown])
  expect(contents.debugger.sendCommand.mock.calls).toEqual([
    ['Page.setWebLifecycleState', { state: 'frozen' }],
    ['Page.setWebLifecycleState', { state: 'active' }],
  ])
})

test('closed tabs and not-yet-navigated tabs do not send lifecycle commands', async () => {
  const contents = setup()
  contents.getURL = () => ''
  await BrowserFreeze.setHidden(1, true, true)
  expect(contents.debugger.sendCommand).not.toHaveBeenCalled()
  jest.mocked(ViewState.get).mockReturnValue(undefined)
  await BrowserFreeze.setHidden(1, true, true)
})
