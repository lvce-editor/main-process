import { beforeEach, expect, jest, test } from '@jest/globals'
import * as ElectronWebContentsViewNavigationFocus from '../src/parts/ElectronWebContentsViewNavigationFocus/ElectronWebContentsViewNavigationFocus.ts'

let parentBlurListener: () => void
let didNavigateListener: any
let didStartNavigationListener: any

const webContents = {
  on: jest.fn((event: string, listener: any) => {
    if (event === 'did-start-navigation') {
      didStartNavigationListener = listener
    } else if (event === 'did-navigate') {
      didNavigateListener = listener
    }
  }),
  once: jest.fn(),
}

const parentWebContents = {
  focus: jest.fn(),
  isDestroyed: jest.fn(() => false),
  isFocused: jest.fn(),
  off: jest.fn(),
  on: jest.fn((_event: string, listener: () => void) => {
    parentBlurListener = listener
  }),
}

beforeEach(() => {
  jest.clearAllMocks()
  parentWebContents.isFocused.mockReset()
  didNavigateListener = undefined
  didStartNavigationListener = undefined
  ElectronWebContentsViewNavigationFocus.attach(webContents as any, parentWebContents as any)
})

test('restores parent focus after a background main-frame navigation', () => {
  parentWebContents.isFocused.mockReturnValue(true)

  didStartNavigationListener({}, 'http://localhost:5173', false, true)
  didNavigateListener()

  expect(parentWebContents.focus).toHaveBeenCalledTimes(1)
})

test('preserves preview focus after an intentional navigation', () => {
  parentWebContents.isFocused.mockReturnValue(false)

  didStartNavigationListener({}, 'http://localhost:5173', false, true)
  didNavigateListener()

  expect(parentWebContents.focus).not.toHaveBeenCalled()
})

test('ignores subframe navigation when the parent owned focus', () => {
  parentWebContents.isFocused.mockReturnValue(true)

  didStartNavigationListener({}, 'http://localhost:5173', false, true)
  didStartNavigationListener({}, 'http://localhost:5173/frame', false, false)
  didNavigateListener()

  expect(parentWebContents.focus).toHaveBeenCalledTimes(1)
})

test('does not reuse focus state from an earlier navigation', () => {
  parentWebContents.isFocused.mockReturnValue(true)
  didStartNavigationListener({}, 'http://localhost:5173', false, true)
  didNavigateListener()

  parentWebContents.isFocused.mockReturnValue(false)
  didStartNavigationListener({}, 'http://localhost:5173/next', false, true)
  didNavigateListener()

  expect(parentWebContents.focus).toHaveBeenCalledTimes(1)
})

test('late navigation cannot restore focus after the user leaves the parent contents', () => {
  parentWebContents.isFocused.mockReturnValue(true)
  didStartNavigationListener({}, 'http://localhost:5173', false, true)
  parentBlurListener()
  didNavigateListener()
  expect(parentWebContents.focus).not.toHaveBeenCalled()
})
