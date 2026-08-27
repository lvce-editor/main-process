import { expect, jest, test } from '@jest/globals'
import * as ElectronWebContentsViewPerformance from '../src/parts/ElectronWebContentsViewPerformance/ElectronWebContentsViewPerformance.ts'

test.each(['https://soundcloud.com/photay/communication', 'https://www.soundcloud.com/discover'])(
  'installs the SoundCloud timer optimization after navigating to %s',
  async (url) => {
    let handleDidNavigate: undefined | ((event: unknown, url: string) => void)
    const executeJavaScript = jest.fn<(code: string) => Promise<unknown>>(async () => undefined)
    const webContents = {
      executeJavaScript,
      on: jest.fn<(event: string, listener: (event: unknown, url: string) => void) => void>((_event, listener) => {
        handleDidNavigate = listener
      }),
    }

    ElectronWebContentsViewPerformance.attach(webContents)
    handleDidNavigate?.({}, url)
    await Promise.resolve()

    expect(executeJavaScript).toHaveBeenCalledWith(ElectronWebContentsViewPerformance.soundCloudTimerOptimizationScript)
  },
)

test.each(['https://example.com/', 'https://soundcloud.com.example.com/', 'not a url'])(
  'does not install the SoundCloud timer optimization after navigating to %s',
  async (url) => {
    let handleDidNavigate: undefined | ((event: unknown, url: string) => void)
    const executeJavaScript = jest.fn<(code: string) => Promise<unknown>>(async () => undefined)
    const webContents = {
      executeJavaScript,
      on: jest.fn<(event: string, listener: (event: unknown, url: string) => void) => void>((_event, listener) => {
        handleDidNavigate = listener
      }),
    }

    ElectronWebContentsViewPerformance.attach(webContents)
    handleDidNavigate?.({}, url)
    await Promise.resolve()

    expect(executeJavaScript).not.toHaveBeenCalled()
  },
)

test('only slows the exact SoundCloud player polling timer', () => {
  const delays: (number | undefined)[] = []
  const context = {
    location: {
      hostname: 'soundcloud.com',
    },
    setTimeout(_callback: unknown, delay?: number) {
      delays.push(delay)
      return delays.length
    },
  }

  ElectronWebContentsViewPerformance.installSoundCloudTimerOptimization(context)
  context.setTimeout(() => {}, 1000 / 60)
  context.setTimeout(() => {}, 16)
  context.setTimeout(() => {}, 17)
  context.setTimeout(() => {}, 50)

  expect(delays).toEqual([100, 16, 17, 50])
})

test('installing the SoundCloud timer optimization is idempotent', () => {
  const delays: (number | undefined)[] = []
  const context = {
    location: {
      hostname: 'soundcloud.com',
    },
    setTimeout(_callback: unknown, delay?: number) {
      delays.push(delay)
      return delays.length
    },
  }

  ElectronWebContentsViewPerformance.installSoundCloudTimerOptimization(context)
  ElectronWebContentsViewPerformance.installSoundCloudTimerOptimization(context)
  context.setTimeout(() => {}, 1000 / 60)

  expect(delays).toEqual([100])
})

test('the script also verifies the current page hostname', () => {
  const delays: (number | undefined)[] = []
  const context = {
    location: {
      hostname: 'example.com',
    },
    setTimeout(_callback: unknown, delay?: number) {
      delays.push(delay)
      return delays.length
    },
  }

  ElectronWebContentsViewPerformance.installSoundCloudTimerOptimization(context)
  context.setTimeout(() => {}, 1000 / 60)

  expect(delays).toEqual([1000 / 60])
})

test('ignores an execution failure caused by a superseding navigation', async () => {
  let handleDidNavigate: undefined | ((event: unknown, url: string) => void)
  const executeJavaScript = jest.fn<(code: string) => Promise<unknown>>(async () => {
    throw new Error('navigation replaced the document')
  })
  const webContents = {
    executeJavaScript,
    on: jest.fn<(event: string, listener: (event: unknown, url: string) => void) => void>((_event, listener) => {
      handleDidNavigate = listener
    }),
  }

  ElectronWebContentsViewPerformance.attach(webContents)
  handleDidNavigate?.({}, 'https://soundcloud.com/photay/communication')
  await Promise.resolve()
  await Promise.resolve()

  expect(executeJavaScript).toHaveBeenCalledTimes(1)
})
