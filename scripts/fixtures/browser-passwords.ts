import { app, BrowserWindow, session } from 'electron'
import assert from 'node:assert/strict'
import * as Form from '../../packages/main-process/src/parts/WebsitePasswordForm/WebsitePasswordForm.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const isolatedSession = session.fromPartition('password-test')
  isolatedSession.protocol.handle(
    'https',
    () =>
      new Response(
        '<form><input autocomplete="username" id="user"><input type="password" id="password"></form><iframe src="https://frame.test/inner"></iframe>',
        { headers: { 'content-type': 'text/html' } },
      ),
  )
  const window = new BrowserWindow({
    show: false,
    webPreferences: { session: isolatedSession, sandbox: true, contextIsolation: true, nodeIntegration: false },
  })
  const contents = window.webContents
  const href = 'https://site.test/login'
  const values = (): Promise<any> => contents.executeJavaScript('[document.querySelector("#user")?.value, document.querySelector("#password").value]')
  try {
    await window.loadURL(href)
    assert.deepEqual(await Form.capture(contents, 'first', href, false), { username: '', password: '' })
    // Neither forging page-world state nor postMessage grants access to the isolated-world target.
    await contents.executeJavaScript(
      'globalThis.lvcePasswordTarget = {token: "forged"}; postMessage({action: "fill", origin: "https://site.test"}, "*")',
    )
    assert.equal(await Form.fill(contents, 'forged', 'alice', 'secret'), false)
    assert.deepEqual(await values(), ['', ''])
    await Form.capture(contents, 'cancelled', href, false)
    await Form.clear(contents, 'cancelled')
    assert.equal(await Form.fill(contents, 'cancelled', 'alice', 'must-not-fill'), false)
    await Form.capture(contents, 'valid', href, false)
    assert.equal(await Form.fill(contents, 'valid', 'alice', 'secret'), true)
    assert.deepEqual(await values(), ['alice', 'secret'])
    assert.equal(await Form.fill(contents, 'valid', 'alice', 'replay'), false)
    assert.deepEqual(await Form.capture(contents, 'save', href, true), { username: 'alice', password: 'secret' })
    // Password-only confirmation supports the same account selection/fill operation.
    await contents.executeJavaScript('document.querySelector("#user").remove(); document.querySelector("#password").value = ""')
    await Form.capture(contents, 'confirmation', href, false)
    assert.equal(await Form.fill(contents, 'confirmation', 'alice', 'confirmation-secret'), true)
    assert.deepEqual(await values(), [undefined, 'confirmation-secret'])
    await Form.capture(contents, 'navigation', href, false)
    await window.loadURL('https://other.test/login')
    assert.equal(await Form.fill(contents, 'navigation', 'alice', 'must-not-fill'), false)
    assert.deepEqual(await values(), ['', ''])
    await window.loadURL(href)
    await Form.capture(contents, 'reload', href, false)
    await window.loadURL(href)
    assert.equal(await Form.fill(contents, 'reload', 'alice', 'must-not-fill'), false)
    await Form.capture(contents, 'changed', href, false)
    await contents.executeJavaScript('document.querySelector("form").action = "https://other.test/steal"')
    assert.equal(await Form.fill(contents, 'changed', 'alice', 'must-not-fill'), false)
    assert.equal(await Form.capture(contents, 'cross-action', href, true), null)
    await window.loadURL(href)
    await Form.capture(contents, 'removed', href, false)
    await contents.executeJavaScript('document.querySelector("#password").outerHTML = \'<input id="password" type="password">\'')
    assert.equal(await Form.fill(contents, 'removed', 'alice', 'must-not-fill'), false)
    await contents.executeJavaScript('document.querySelector("form").remove()')
    assert.equal(await Form.capture(contents, 'frame-only', href, false), null)
    await window.loadURL(href)
    await Form.capture(contents, 'spa', href, false)
    await contents.executeJavaScript('history.pushState({}, "", "/different")')
    assert.equal(await Form.fill(contents, 'spa', 'alice', 'must-not-fill'), false)
    console.log(
      'PASS: isolated password capture/fill, confirmation, forged messages, cross-origin forms, navigation, reload, replacement and subframes',
    )
  } finally {
    window.destroy()
  }
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
