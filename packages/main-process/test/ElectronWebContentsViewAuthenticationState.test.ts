import { beforeEach, expect, jest, test } from '@jest/globals'
import * as ElectronWebContentsViewAuthenticationState from '../src/parts/ElectronWebContentsViewAuthenticationState/ElectronWebContentsViewAuthenticationState.ts'

beforeEach(() => {
  ElectronWebContentsViewAuthenticationState.clear()
})

test('accepts a pending login once', () => {
  const callback = jest.fn()
  const requestId = ElectronWebContentsViewAuthenticationState.add(12, callback)

  ElectronWebContentsViewAuthenticationState.accept(requestId, 'admin', 'secret')
  ElectronWebContentsViewAuthenticationState.accept(requestId, 'other', 'credentials')

  expect(callback).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith('admin', 'secret')
})

test('cancels a pending login', () => {
  const callback = jest.fn()
  const requestId = ElectronWebContentsViewAuthenticationState.add(12, callback)

  ElectronWebContentsViewAuthenticationState.cancel(requestId)

  expect(callback).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith()
})

test('cancels pending logins when their web contents is disposed', () => {
  const firstCallback = jest.fn()
  const secondCallback = jest.fn()
  ElectronWebContentsViewAuthenticationState.add(12, firstCallback)
  ElectronWebContentsViewAuthenticationState.add(13, secondCallback)

  ElectronWebContentsViewAuthenticationState.cancelForWebContents(12)

  expect(firstCallback).toHaveBeenCalledTimes(1)
  expect(secondCallback).not.toHaveBeenCalled()
})
