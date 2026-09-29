import * as RpcRegistry from '@lvce-editor/rpc-registry'
import { app, BrowserWindow } from 'electron'
import assert from 'node:assert/strict'
import { createWebContentsView } from '../../packages/main-process/src/parts/ElectronWebContentsView/ElectronWebContentsView.ts'
import * as State from '../../packages/main-process/src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const main = async () => {
  await app.whenReady()
  const window = new BrowserWindow({ height: 700, width: 1000 })
  const id = await createWebContentsView(0, window.id, 100)
  const { view } = State.get(id)
  const wc = view.webContents
  const messages = []
  RpcRegistry.set(100, { send: (...args) => messages.push(args) })
  State.setFallthroughKeyBindings([87, 2050])
  const html =
    '<body tabindex="0"><input id="input"><textarea id="textarea"></textarea><div id="editable" contenteditable></div><div id="shadow"></div><iframe srcdoc="<body tabindex=0><input id=input><textarea id=textarea></textarea><div id=editable contenteditable></div>"></iframe><script>document.querySelector("#shadow").attachShadow({mode:"open"}).innerHTML="<input>"</script>'
  const navigate = () => wc.loadURL('data:text/html,' + encodeURIComponent(html))
  const settle = () => wc.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  const press = async (key = '.', modifiers = []) => {
    wc.sendInputEvent({ type: 'keyDown', keyCode: key, modifiers })
    if (key === '.') wc.sendInputEvent({ type: 'char', keyCode: key, modifiers })
    wc.sendInputEvent({ type: 'keyUp', keyCode: key, modifiers })
    await settle()
  }
  await navigate()
  window.focus()
  wc.focus()
  for (let navigation = 0; navigation < 2; navigation++) {
    assert.equal(await wc.executeJavaScript('typeof require'), 'undefined')
    assert.equal(await wc.executeJavaScript('typeof document.querySelector("iframe").contentWindow.require'), 'undefined')
    for (const context of ['document', 'document.querySelector("iframe").contentDocument']) {
      for (const selector of ['#input', '#textarea', '#editable']) {
        const element = `${context}.querySelector(${JSON.stringify(selector)})`
        await wc.executeJavaScript(`${element}.focus()`)
        const before = messages.length
        await press()
        assert.equal(await wc.executeJavaScript(`${element}.value ?? ${element}.textContent`), '.', context + selector)
        assert.equal(messages.length, before, 'text entry must not forward a shortcut')
        assert.equal(await wc.executeJavaScript(`${context}.activeElement === ${element}`), true)
      }
    }
    await wc.executeJavaScript('document.querySelector("iframe").contentDocument.body.focus()')
    const beforeFrame = messages.length
    await press()
    assert.equal(messages.length, beforeFrame + 1, 'non-editable frame must forward period')
    await wc.executeJavaScript('document.querySelector("#shadow").shadowRoot.querySelector("input").focus()')
    const beforeShadow = messages.length
    await press()
    assert.equal(await wc.executeJavaScript('document.querySelector("#shadow").shadowRoot.querySelector("input").value'), '.')
    assert.equal(messages.length, beforeShadow)
    await wc.executeJavaScript('document.body.focus()')
    const beforeBody = messages.length
    await press()
    assert.equal(messages.length, beforeBody + 1, 'non-editable page must forward period')
    assert.deepEqual(messages.at(-1), ['ElectronBrowserView.handleKeyBinding', id, 87])
    await press('Tab', ['control'])
    assert.deepEqual(messages.at(-1), ['ElectronBrowserView.handleKeyBinding', id, 2050])
    const zoom = wc.getZoomLevel()
    await press('+', ['control', 'shift'])
    assert.ok(wc.getZoomLevel() > zoom)
    window.webContents.focus()
    wc.focus()
    await navigate()
  }
  State.setFallthroughKeyBindings([])
  const beforeDisabled = messages.length
  await wc.executeJavaScript('document.body.focus()')
  await press()
  assert.equal(messages.length, beforeDisabled)
  const frameLoaded = new Promise((resolve) => wc.once('did-frame-finish-load', resolve))
  await wc.executeJavaScript(
    `document.querySelector('iframe').removeAttribute('srcdoc'); document.querySelector('iframe').src = 'data:text/html,<body tabindex=0><input><textarea></textarea><div contenteditable></div>'`,
  )
  await frameLoaded
  const frame = wc.mainFrame.frames[0]
  assert.equal(await frame.executeJavaScript('typeof require'), 'undefined')
  for (const selector of ['input', 'textarea', 'div']) {
    await frame.executeJavaScript(`document.querySelector('${selector}').focus()`)
    State.setFallthroughKeyBindings([87])
    const before = messages.length
    await press()
    assert.equal(
      await frame.executeJavaScript(`document.querySelector('${selector}').value ?? document.querySelector('${selector}').textContent`),
      '.',
    )
    assert.equal(messages.length, before)
  }
  await frame.executeJavaScript('document.body.focus()')
  const beforeCrossOrigin = messages.length
  await press()
  assert.equal(messages.length, beforeCrossOrigin + 1)
  window.destroy()
  console.log('PASS: period text entry, frames, shadow DOM, navigation, focus changes and existing shortcuts')
}

main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
