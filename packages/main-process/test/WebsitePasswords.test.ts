/* eslint-disable sonarjs/no-hardcoded-passwords -- Deliberately synthetic credentials for password isolation tests. */
import { beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'

const contents = Object.assign(new EventEmitter(), { getURL: () => 'https://site.test/login', isDestroyed: () => false })
const window = Object.assign(new EventEmitter(), { isDestroyed: () => false })
const state = { browserWindow: window, view: { webContents: contents } }
let currentState: unknown = state
const available = jest.fn(() => true)
const list = jest.fn<() => Promise<{ origin: string; username: string }[]>>(async () => [{ origin: 'https://site.test', username: 'alice' }])
const get = jest.fn<(origin: string, username: string) => Promise<{ origin: string; username: string; password: string }>>(async () => ({
  origin: 'https://site.test',
  password: 'private-password',
  username: 'alice',
}))
const save = jest.fn<(credential: unknown, current: () => boolean) => Promise<void>>(async () => undefined)
const remove = jest.fn<(origin: string, username: string) => Promise<void>>(async () => undefined)
const capture = jest.fn(async () => ({ password: 'new-password', username: 'alice' }))
const fill = jest.fn<(contents: unknown, token: string, username: string, password: string) => Promise<boolean>>(async () => true)
const showMessageBox = jest.fn<(window: unknown, options: any) => Promise<{ response: number }>>(async () => ({ response: 1 }))
let choice: number | undefined = 0
const buildFromTemplate = jest.fn((entries: any[]) => ({
  closePopup: jest.fn(),
  popup: ({ callback }: { callback: () => void }) => {
    if (choice !== undefined) entries[choice].click()
    callback()
  },
}))
jest.unstable_mockModule('electron', () => ({ dialog: { showMessageBox }, Menu: { buildFromTemplate } }))
jest.unstable_mockModule('../src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts', () => ({ get: () => currentState }))
jest.unstable_mockModule('../src/parts/WebsitePasswordStorage/WebsitePasswordStorage.ts', () => ({
  get,
  getOrigin: (url: string) => new URL(url).origin,
  isAvailable: available,
  list,
  remove,
  save,
}))
jest.unstable_mockModule('../src/parts/WebsitePasswordForm/WebsitePasswordForm.ts', () => ({ capture, clear: jest.fn(async () => undefined), fill }))
const Passwords = await import('../src/parts/WebsitePasswords/WebsitePasswords.ts')

beforeEach(() => {
  jest.clearAllMocks()
  choice = 0
  currentState = state
  available.mockReturnValue(true)
  capture.mockImplementation(async () => ({ password: 'new-password', username: 'alice' }))
  get.mockImplementation(async () => ({ origin: 'https://site.test', password: 'private-password', username: 'alice' }))
  showMessageBox.mockImplementation(async () => ({ response: 1 }))
})

test('save requires trusted consent and decline writes nothing', async () => {
  showMessageBox.mockResolvedValueOnce({ response: 0 })
  await Passwords.show(1, 'save')
  expect(save).not.toHaveBeenCalled()
  await Passwords.show(1, 'save')
  expect(save).toHaveBeenCalledWith({ origin: 'https://site.test', password: 'new-password', username: 'alice' }, expect.any(Function))
  expect(showMessageBox).toHaveBeenLastCalledWith(window, expect.objectContaining({ buttons: ['Cancel', 'Update'] }))
  expect(JSON.stringify(showMessageBox.mock.calls)).not.toContain('new-password')
})

test('account selection fills only the selected saved account without returning plaintext', async () => {
  expect(await Passwords.show(1, 'fill')).toBeUndefined()
  expect(get).toHaveBeenCalledWith('https://site.test', 'alice')
  expect(fill).toHaveBeenCalledWith(contents, expect.any(String), 'alice', 'private-password')
  expect(JSON.stringify(buildFromTemplate.mock.calls)).not.toContain('private-password')
})

test('cancelled account selection never decrypts', async () => {
  choice = undefined
  await Passwords.show(1, 'fill')
  expect(get).not.toHaveBeenCalled()
  expect(fill).not.toHaveBeenCalled()
})

test('unavailable keyring explains the restriction without capturing or decrypting', async () => {
  available.mockReturnValue(false)
  await Passwords.show(1, 'save')
  await Passwords.show(1, 'fill')
  expect(capture).not.toHaveBeenCalled()
  expect(get).not.toHaveBeenCalled()
  expect(showMessageBox).toHaveBeenCalledWith(window, expect.objectContaining({ detail: expect.stringContaining('OS keyring') }))
})

test('navigation during consent cancels saving', async () => {
  showMessageBox.mockImplementationOnce(async () => {
    contents.emit('did-start-navigation', {}, 'https://other.test', false, true)
    return { response: 1 }
  })
  await Passwords.show(1, 'save')
  expect(save).not.toHaveBeenCalled()
  expect(contents.listenerCount('did-start-navigation')).toBe(0)
})

test.each(['navigation', 'disposal', 'connection close'])('%s during decryption prevents credential delivery', async (event) => {
  get.mockImplementationOnce(async () => {
    switch (event) {
      case 'connection close': {
        currentState = undefined
        // No default
        break
      }
      case 'disposal': {
        contents.emit('destroyed')
        break
      }
      case 'navigation': {
        contents.emit('did-start-navigation', {}, 'https://other.test', false, true)
        break
      }
    }
    return { origin: 'https://site.test', password: 'private-password', username: 'alice' }
  })
  await Passwords.show(1, 'fill')
  expect(fill).not.toHaveBeenCalled()
  expect(contents.listenerCount('destroyed')).toBe(0)
})

test('manager deletes only after confirmation and lists no passwords', async () => {
  await Passwords.show(1, 'manage')
  expect(remove).toHaveBeenCalledWith('https://site.test', 'alice')
  expect(get).not.toHaveBeenCalled()
  expect(capture).not.toHaveBeenCalled()
})

test('unknown actions and missing tabs cannot capture credentials', async () => {
  await Passwords.show(1, 'forged')
  currentState = undefined
  await Passwords.show(1, 'save')
  expect(capture).not.toHaveBeenCalled()
})
