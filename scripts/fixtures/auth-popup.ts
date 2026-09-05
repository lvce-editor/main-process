import { app, BrowserWindow, webContents } from 'electron'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import * as ElectronWebContentsView from '../../packages/main-process/src/parts/ElectronWebContentsView/ElectronWebContentsView.ts'
import * as ElectronWebContentsViewState from '../../packages/main-process/src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

process.on('uncaughtException', (error) => {
  console.error(error)
  app.exit(1)
})

const main = async () => {
  await app.whenReady()
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html')
    response.end('<!doctype html><title>Authentication fixture</title><link rel="icon" href="data:,">')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const browserWindow = new BrowserWindow({ show: false })
  const openerId = await ElectronWebContentsView.createWebContentsView()
  const opener = webContents.fromId(openerId)!
  await opener.loadURL(origin)
  for (const initialUrl of [`${origin}/auth`, 'about:blank']) {
    await opener.executeJavaScript(
      `
      window.authResult = new Promise(resolve => window.addEventListener('message', event => resolve(event.data), { once: true }));
      document.cookie = 'session=shared';
      window.popup = window.open('${initialUrl}', 'soundcloud-auth', 'width=500,height=600');
      undefined;
    `,
      true,
    )
    const popup = browserWindow.contentView.children
      .map((view: any) => view.webContents)
      .find((contents) => contents.id !== openerId && contents !== browserWindow.webContents)
    assert.ok(popup, 'authentication popup must be attached as a WebContentsView')
    if (popup.isLoading()) {
      await once(popup, 'did-finish-load')
    }
    assert.equal(BrowserWindow.getAllWindows().length, 1, 'popup must not create a separate BrowserWindow')
    assert.equal(await opener.executeJavaScript('popup !== null && !popup.closed'), true, `popup is open (${initialUrl})`)
    assert.equal(await popup.executeJavaScript('window.opener !== null'), true, `opener is preserved at ${popup.getURL()} (${initialUrl})`)
    // Navigate across origins, as an identity provider does, then return to the callback.
    const providerLoaded = once(popup, 'did-finish-load')
    await popup.executeJavaScript(`location.href = 'http://localhost:${address.port}/provider'; undefined`)
    await providerLoaded
    assert.equal(await popup.executeJavaScript('window.opener !== null'), true, `opener is preserved at ${popup.getURL()} (${initialUrl})`)
    const callbackLoaded = once(popup, 'did-finish-load')
    await popup.executeJavaScript(`location.href = '${origin}/callback'; undefined`)
    await callbackLoaded
    assert.equal(await popup.executeJavaScript('document.cookie'), 'session=shared')
    await popup.executeJavaScript(`window.opener.postMessage('authenticated', '${origin}')`)
    assert.equal(await opener.executeJavaScript('authResult'), 'authenticated')
    const popupId = popup.id
    const destroyed = once(popup, 'destroyed')
    await popup.executeJavaScript('window.close()')
    await destroyed
    assert.equal(await opener.executeJavaScript('popup.closed'), true)
    assert.equal(ElectronWebContentsViewState.get(popupId), undefined)
    assert.equal(browserWindow.contentView.children.length, 1)
  }
  console.log('PASS: popup tab preserves opener, cookies, postMessage, and window.close()')
  server.close()
  app.exit(0)
}

main().catch((error) => {
  console.error(error)
  app.exit(1)
})
