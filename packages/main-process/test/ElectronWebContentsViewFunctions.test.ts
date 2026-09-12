import { beforeEach, expect, jest, test } from '@jest/globals'

const getAppMetrics = jest.fn<() => Electron.ProcessMetric[]>()

jest.unstable_mockModule('electron', () => ({
  app: {
    getAppMetrics,
  },
  BrowserWindow: {},
}))

const ElectronWebContentsViewFunctions = await import('../src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts')
const ElectronWebContentsViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')

beforeEach(() => {
  getAppMetrics.mockReset()
  ElectronWebContentsViewState.remove(42)
})

test('hides and restores a browser page without detaching its native surface', () => {
  const view = { setVisible: jest.fn() }
  const contentView = { addChildView: jest.fn(), children: [view], removeChildView: jest.fn() }
  ElectronWebContentsViewState.add(42, { contentView }, view)

  ElectronWebContentsViewFunctions.hide(42)
  ElectronWebContentsViewFunctions.show(42)
  ElectronWebContentsViewFunctions.show(42)

  expect(view.setVisible.mock.calls).toEqual([[false], [true], [true]])
  expect(contentView.removeChildView).not.toHaveBeenCalled()
  expect(contentView.addChildView).not.toHaveBeenCalled()
})

test('attaches a detached browser page to its registered owner before showing it', () => {
  const events: string[] = []
  const view = {
    setVisible: jest.fn<(visible: boolean) => void>(() => {
      events.push('visible')
    }),
  }
  const contentView = {
    addChildView: jest.fn<(view: unknown) => void>(() => {
      events.push('attached')
    }),
    children: [],
  }
  ElectronWebContentsViewState.add(42, { contentView }, view)

  ElectronWebContentsViewFunctions.show(42)

  expect(contentView.addChildView).toHaveBeenCalledWith(view)
  expect(view.setVisible).toHaveBeenCalledWith(true)
  expect(events).toEqual(['attached', 'visible'])
})

test('ignores visibility commands for disposed browser pages', () => {
  expect(() => ElectronWebContentsViewFunctions.hide(42)).not.toThrow()
  expect(() => ElectronWebContentsViewFunctions.show(42)).not.toThrow()
})

test('stores fallthrough keybindings instead of the wrapped web contents view', () => {
  const view = {} as Electron.BrowserView
  const keyBindings = [2050, 3074]

  ElectronWebContentsViewFunctions.setFallThroughKeyBindings(view, keyBindings)

  expect(ElectronWebContentsViewState.getFallthroughKeyBindings()).toEqual(keyBindings)
})

test('capturePage returns png bytes', async () => {
  const png = new Uint8Array([137, 80, 78, 71])
  const toPNG = jest.fn(() => png)
  const capturePage = jest.fn(async () => ({ isEmpty: () => false, toPNG }))
  const view = {
    webContents: {
      capturePage,
    },
  } as unknown as Electron.WebContentsView

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toBe(png)
  expect(capturePage).toHaveBeenCalledTimes(1)
  expect(toPNG).toHaveBeenCalledTimes(1)
})

test('forwards the user gesture flag when executing JavaScript', async () => {
  const executeJavaScript = jest.fn<(code: string, userGesture: boolean) => Promise<string>>(async () => 'result')
  const view = {
    webContents: {
      executeJavaScript,
    },
  } as unknown as Electron.WebContentsView

  await expect(ElectronWebContentsViewFunctions.executeJavaScript(view, 'play()', true)).resolves.toBe('result')
  expect(executeJavaScript).toHaveBeenCalledWith('play()', true)
})

test('click sends native mouse input to the center of an element', async () => {
  const executeJavaScript = jest.fn<(code: string) => Promise<{ readonly x: number; readonly y: number }>>(async () => ({ x: 24, y: 48 }))
  const sendInputEvent = jest.fn<(event: Readonly<Record<string, unknown>>) => void>()
  const view = {
    webContents: {
      executeJavaScript,
      sendInputEvent,
    },
  } as unknown as Electron.WebContentsView

  await expect(ElectronWebContentsViewFunctions.click(view, '.playButton')).resolves.toBe(true)
  expect(executeJavaScript.mock.calls[0][0]).toContain('document.querySelector(".playButton")')
  expect(sendInputEvent).toHaveBeenNthCalledWith(1, { button: 'left', clickCount: 1, type: 'mouseMove', x: 24, y: 48 })
  expect(sendInputEvent).toHaveBeenNthCalledWith(2, { button: 'left', clickCount: 1, type: 'mouseDown', x: 24, y: 48 })
  expect(sendInputEvent).toHaveBeenNthCalledWith(3, { button: 'left', clickCount: 1, type: 'mouseUp', x: 24, y: 48 })
})

test('click returns false when the selector does not match', async () => {
  const executeJavaScript = jest.fn<(code: string) => Promise<undefined>>(async () => undefined)
  const sendInputEvent = jest.fn<(event: Readonly<Record<string, unknown>>) => void>()
  const view = {
    webContents: {
      executeJavaScript,
      sendInputEvent,
    },
  } as unknown as Electron.WebContentsView

  await expect(ElectronWebContentsViewFunctions.click(view, '.missing')).resolves.toBe(false)
  expect(sendInputEvent).not.toHaveBeenCalled()
})

test('setAudioMuted updates the web contents audio state', () => {
  const setAudioMuted = jest.fn<(muted: boolean) => void>()
  const view = {
    webContents: {
      setAudioMuted,
    },
  } as unknown as Electron.BrowserView

  ElectronWebContentsViewFunctions.setAudioMuted(view, true)

  expect(setAudioMuted).toHaveBeenCalledWith(true)
})

test('getStats includes the web contents audio state', () => {
  const view = {
    webContents: {
      getTitle: jest.fn(() => 'Example'),
      getURL: jest.fn(() => 'https://example.com'),
      isAudioMuted: jest.fn(() => true),
      isFocused: jest.fn(() => false),
      navigationHistory: {
        canGoBack: jest.fn(() => false),
        canGoForward: jest.fn(() => true),
      },
    },
  } as unknown as Electron.BrowserView

  expect(ElectronWebContentsViewFunctions.getStats(view)).toEqual({
    canGoBack: false,
    canGoForward: true,
    isAudioMuted: true,
    isFocused: false,
    lastFocusedAt: 0,
    title: 'Example',
    url: 'https://example.com',
  })
})

test('getStats includes the renderer working set in bytes when requested', () => {
  getAppMetrics.mockReturnValue([
    {
      memory: { peakWorkingSetSize: 84, workingSetSize: 42 },
      pid: 123,
      type: 'Tab',
    } as Electron.ProcessMetric,
  ])
  const view = {
    webContents: {
      getOSProcessId: jest.fn(() => 123),
      getTitle: jest.fn(() => 'Example'),
      getURL: jest.fn(() => 'https://example.com'),
      isAudioMuted: jest.fn(() => false),
      isFocused: jest.fn(() => false),
      navigationHistory: {
        canGoBack: jest.fn(() => false),
        canGoForward: jest.fn(() => false),
      },
    },
  } as unknown as Electron.BrowserView

  expect(ElectronWebContentsViewFunctions.getStats(view, true)).toEqual({
    canGoBack: false,
    canGoForward: false,
    isAudioMuted: false,
    isFocused: false,
    lastFocusedAt: 0,
    memory: 42 * 1024,
    title: 'Example',
    url: 'https://example.com',
  })
})

test('pressKey focuses the page and sends matching native key events', () => {
  const focus = jest.fn()
  const sendInputEvent = jest.fn()
  const view = { webContents: { focus, isDestroyed: () => false, sendInputEvent } } as unknown as Electron.WebContentsView
  ElectronWebContentsViewFunctions.pressKey(view, 'L', ['shift'])
  expect(focus).toHaveBeenCalledTimes(1)
  expect(sendInputEvent.mock.calls).toEqual([
    [{ keyCode: 'L', modifiers: ['shift'], type: 'keyDown' }],
    [{ keyCode: 'L', modifiers: ['shift'], type: 'keyUp' }],
  ])
})

test('pressKey rejects a destroyed page without sending input', () => {
  const sendInputEvent = jest.fn()
  const view = { webContents: { isDestroyed: () => true, sendInputEvent } } as unknown as Electron.WebContentsView
  expect(() => ElectronWebContentsViewFunctions.pressKey(view, 'Space')).toThrow('closed browser tab')
  expect(sendInputEvent).not.toHaveBeenCalled()
})

const createCaptureView = () => {
  const png = new Uint8Array([137, 80, 78, 71])
  const image = { isEmpty: () => false, toPNG: () => png }
  const webContents = {
    capturePage: jest.fn<() => Promise<typeof image>>().mockResolvedValue(image),
    invalidate: jest.fn(),
    isDestroyed: jest.fn(() => false),
  }
  return { image, png, view: { webContents } as unknown as Electron.WebContentsView, webContents }
}

test.each(['UnknownVizError', 'VizSentEmptyBitmap', 'Current display surface not available for capture'])(
  'capturePage repaints and recovers from %s without reloading the page',
  async (message) => {
    const { png, view, webContents } = createCaptureView()
    webContents.capturePage.mockRejectedValueOnce(new Error(message))

    await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toEqual(png)
    expect(webContents.invalidate).toHaveBeenCalledTimes(1)
    expect(webContents.capturePage).toHaveBeenCalledTimes(2)
  },
)

test('capturePage retries an empty native image instead of returning a blank overlay', async () => {
  const { png, view, webContents } = createCaptureView()
  webContents.capturePage.mockResolvedValueOnce({ isEmpty: () => true, toPNG: () => new Uint8Array() })

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toEqual(png)
  expect(webContents.invalidate).toHaveBeenCalledTimes(1)
  expect(webContents.capturePage).toHaveBeenCalledTimes(2)
})

test('capturePage rejects a persistently empty surface instead of hiding the live page', async () => {
  const { view, webContents } = createCaptureView()
  webContents.capturePage.mockResolvedValue({ isEmpty: () => true, toPNG: () => new Uint8Array() })

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).rejects.toThrow('Empty page capture')
  expect(webContents.capturePage).toHaveBeenCalledTimes(2)
})

test('capturePage bounds recovery when the compositor keeps failing', async () => {
  const { view, webContents } = createCaptureView()
  const error = new Error('UnknownVizError')
  webContents.capturePage.mockRejectedValue(error)

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).rejects.toBe(error)
  expect(webContents.capturePage).toHaveBeenCalledTimes(2)
  expect(webContents.invalidate).toHaveBeenCalledTimes(1)
})

test('capturePage leaves unrelated errors unchanged', async () => {
  const { view, webContents } = createCaptureView()
  const error = new Error('Object has been destroyed')
  webContents.capturePage.mockRejectedValue(error)

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).rejects.toBe(error)
  expect(webContents.capturePage).toHaveBeenCalledTimes(1)
  expect(webContents.invalidate).not.toHaveBeenCalled()
})

test('capturePage does not repaint a view destroyed during capture', async () => {
  const { view, webContents } = createCaptureView()
  webContents.capturePage.mockRejectedValue(new Error('UnknownVizError'))
  webContents.isDestroyed.mockReturnValue(true)

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).rejects.toThrow('UnknownVizError')
  expect(webContents.invalidate).not.toHaveBeenCalled()
})

test('capturePage shares concurrent captures but captures again after completion', async () => {
  const { image, png, view, webContents } = createCaptureView()
  const pending = Promise.withResolvers<typeof image>()
  webContents.capturePage.mockReturnValueOnce(pending.promise)

  const first = ElectronWebContentsViewFunctions.capturePage(view)
  const second = ElectronWebContentsViewFunctions.capturePage(view)
  expect(webContents.capturePage).toHaveBeenCalledTimes(1)
  pending.resolve(image)
  await expect(Promise.all([first, second])).resolves.toEqual([png, png])
  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toEqual(png)
  expect(webContents.capturePage).toHaveBeenCalledTimes(2)
})

test('capturePage releases a failed pending capture so the next request can recover', async () => {
  const { image, png, view, webContents } = createCaptureView()
  webContents.capturePage.mockRejectedValue(new Error('UnknownVizError'))
  await expect(ElectronWebContentsViewFunctions.capturePage(view)).rejects.toThrow('UnknownVizError')
  webContents.capturePage.mockResolvedValue(image)
  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toEqual(png)
  expect(webContents.capturePage).toHaveBeenCalledTimes(3)
})
