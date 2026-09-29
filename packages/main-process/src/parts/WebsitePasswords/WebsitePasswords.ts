import type { BrowserWindow, WebContents } from 'electron'
import { dialog, Menu } from 'electron'
import { randomUUID } from 'node:crypto'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as WebsitePasswordForm from '../WebsitePasswordForm/WebsitePasswordForm.ts'
import * as WebsitePasswordStorage from '../WebsitePasswordStorage/WebsitePasswordStorage.ts'

const active = new WeakSet<WebContents>()

const label = (value: string): string =>
  Array.from(value, (character) => (character.codePointAt(0)! < 32 || character.codePointAt(0) === 127 ? ' ' : character))
    .join('')
    .slice(0, 200) || '(no username)'

const select = (window: BrowserWindow, entries: readonly string[], signal: AbortSignal): Promise<number | undefined> => {
  if (signal.aborted) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    let selected: number | undefined
    const menu = Menu.buildFromTemplate(
      entries.map((entry, index) => ({
        click: () => {
          selected = index
        },
        label: entry,
      })),
    )
    const close = (): void => menu.closePopup(window)
    signal.addEventListener('abort', close, { once: true })
    menu.popup({
      callback: () => {
        signal.removeEventListener('abort', close)
        resolve(signal.aborted ? undefined : selected)
      },
      window,
    })
  })
}

interface Operation {
  readonly contents: WebContents
  readonly current: () => boolean
  readonly message: (detail: string, buttons?: string[]) => Promise<number>
  readonly signal: AbortSignal
  readonly window: BrowserWindow
}

const manage = async ({ current, message, signal, window }: Operation): Promise<void> => {
  const entries = await WebsitePasswordStorage.list()
  if (!current()) return
  if (entries.length === 0) {
    await message('No saved website passwords. Use Save Password on a filled login form.')
    return
  }
  const index = await select(
    window,
    entries.map((entry) => `${entry.origin} — ${label(entry.username)}`),
    signal,
  )
  if (index === undefined || !current()) return
  const entry = entries[index]
  if ((await message(`Delete the saved password for ${label(entry.username)} at ${entry.origin}?`, ['Cancel', 'Delete'])) !== 1) return
  await WebsitePasswordStorage.remove(entry.origin, entry.username)
}

const save = async (
  { current, message, signal, window }: Operation,
  form: { username: string; password: string },
  origin: string,
  entries: readonly { username: string }[],
): Promise<void> => {
  if (!form.password || form.password.length > 16_384) {
    await message('Enter a password in the page before saving it.')
    return
  }
  let username = form.username
  if (!username && entries.length > 0) {
    const index = await select(window, [...entries.map((entry) => label(entry.username)), 'Save without a username'], signal)
    if (index === undefined || !current()) return
    username = entries[index]?.username || ''
  }
  const exists = entries.some((entry) => entry.username === username)
  const verb = exists ? 'Update' : 'Save'
  if ((await message(`${verb} the password for ${label(username)} at ${origin}?`, ['Cancel', verb])) !== 1) return
  await WebsitePasswordStorage.save({ origin, password: form.password, username }, current)
}

const fill = async (
  { contents, current, message, signal, window }: Operation,
  origin: string,
  entries: readonly { username: string }[],
  href: string,
  token: string,
): Promise<void> => {
  if (entries.length === 0) {
    await message(`No saved passwords for ${origin}.`)
    return
  }
  const index = await select(
    window,
    entries.map((entry) => `${label(entry.username)} — ${origin}`),
    signal,
  )
  if (index === undefined || !current()) return
  const credential = await WebsitePasswordStorage.get(origin, entries[index].username)
  if (!credential || !current() || contents.getURL() !== href || !WebsitePasswordStorage.isAvailable()) return
  const filled = await WebsitePasswordForm.fill(contents, token, credential.username, credential.password)
  if (!filled && current()) await message('The form changed. Focus its password field and choose Fill Password again.')
}

const run = async (operation: Operation, action: string): Promise<void> => {
  const { contents, current, message } = operation
  if (!WebsitePasswordStorage.isAvailable()) {
    await message('Saving and filling passwords requires an available OS keyring. Unlock or configure your system keyring, then restart LVCE Editor.')
    return
  }
  if (action === 'manage') return manage(operation)
  let origin: string
  const href = contents.getURL()
  try {
    origin = WebsitePasswordStorage.getOrigin(href)
  } catch {
    await message('Saving and filling passwords is available only on HTTPS pages.')
    return
  }
  const token = randomUUID()
  try {
    const form = await WebsitePasswordForm.capture(contents, token, href, action === 'save')
    if (!current()) return
    if (!form) {
      await message('Focus a visible password field in a top-level form that submits to this site, then try again.')
      return
    }
    const entries = (await WebsitePasswordStorage.list()).filter((entry) => entry.origin === origin)
    if (!current()) return
    if (action === 'save') return await save(operation, form, origin, entries)
    return await fill(operation, origin, entries, href, token)
  } finally {
    await WebsitePasswordForm.clear(contents, token)
  }
}

export const show = async (id: number, action: string): Promise<void> => {
  const state = ElectronWebContentsViewState.get(id)
  if (!state || !['save', 'fill', 'manage'].includes(action)) return
  const { browserWindow: window, view } = state
  const contents: WebContents = view.webContents
  if (contents.isDestroyed() || window.isDestroyed() || active.has(contents)) return
  active.add(contents)
  const controller = new AbortController()
  const { signal } = controller
  const cancel = (): void => controller.abort()
  const navigation = (_event, _url, _inPlace, isMainFrame): void => {
    if (isMainFrame) cancel()
  }
  contents.on('did-start-navigation', navigation)
  contents.once('destroyed', cancel)
  window.once('closed', cancel)
  const current = (): boolean => !signal.aborted && !contents.isDestroyed() && !window.isDestroyed() && ElectronWebContentsViewState.get(id) === state
  const message = async (detail: string, buttons = ['OK']): Promise<number> => {
    if (!current()) return -1
    const result = await dialog.showMessageBox(window, {
      buttons,
      cancelId: 0,
      defaultId: 0,
      detail,
      message: 'Website passwords',
      signal,
      title: 'Simple Browser Passwords',
    })
    return current() ? result.response : -1
  }
  try {
    await run({ contents, current, message, signal, window }, action)
  } catch {
    // Neither website data nor vault errors belong in logs/RPC error payloads.
    try {
      if (current()) await message('Could not complete the password operation. Existing saved passwords have been preserved.')
    } catch {
      // The owner may close while the error dialog is opening.
    }
  } finally {
    controller.abort()
    contents.removeListener('did-start-navigation', navigation)
    contents.removeListener('destroyed', cancel)
    window.removeListener('closed', cancel)
    active.delete(contents)
  }
}
