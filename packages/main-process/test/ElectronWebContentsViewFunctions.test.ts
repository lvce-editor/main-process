import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('electron', () => ({
  BrowserWindow: {},
}))

const ElectronWebContentsViewFunctions = await import(
  '../src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts'
)
const ElectronWebContentsViewState = await import('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts')

test('stores fallthrough keybindings instead of the wrapped web contents view', () => {
  const view = {} as Electron.BrowserView
  const keyBindings = [2050, 3074]

  ElectronWebContentsViewFunctions.setFallThroughKeyBindings(view, keyBindings)

  expect(ElectronWebContentsViewState.getFallthroughKeyBindings()).toEqual(keyBindings)
})

test('capturePage returns a data url', async () => {
  const toDataURL = jest.fn(() => 'data:image/png;base64,c25hcHNob3Q=')
  const capturePage = jest.fn(async () => ({ toDataURL }))
  const view = {
    webContents: {
      capturePage,
    },
  } as unknown as Electron.WebContentsView

  await expect(ElectronWebContentsViewFunctions.capturePage(view)).resolves.toBe('data:image/png;base64,c25hcHNob3Q=')
  expect(capturePage).toHaveBeenCalledTimes(1)
  expect(toDataURL).toHaveBeenCalledTimes(1)
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
