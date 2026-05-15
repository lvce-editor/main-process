import { afterEach, beforeEach, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetModules()
})

afterEach(async () => {
  // @ts-ignore
  ;(await import('../src/parts/ElectronSessionState/ElectronSessionState.ts')).set(undefined)
})

test.todo('get')

test.todo('get - error')

test.todo('handlePermissionCheck - allow writing to clipboard')

test.todo('handlePermissionRequests - allow reading from')
