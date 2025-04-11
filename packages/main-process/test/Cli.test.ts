import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('electron', () => {
  return {
    app: {
      exit() {},
      whenReady() {},
    },
    BrowserWindow: class {},
    MessageChannelMain: class {},
  }
})

const Cli = await import('../src/parts/Cli/Cli.js')

test('handleFastCliArgsMaybe - nothing matches', async () => {
  const spy = jest.spyOn(console, 'info')
  const moduleId = 0
  expect(
    await Cli.handleFastCliArgs(moduleId, {
      _: ['/tmp/'],
      help: false,
      v: false,
      version: false,
      wait: false,
      web: false,
    }),
  ).toBe(false)
  expect(spy).not.toHaveBeenCalled()
})
