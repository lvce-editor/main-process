import { app, BrowserWindow, WebContentsView } from 'electron'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import * as BrowserFreeze from '../../packages/main-process/src/parts/BrowserFreeze/BrowserFreeze.ts'
import * as Views from '../../packages/main-process/src/parts/ElectronWebContentsViewFunctions/ElectronWebContentsViewFunctions.ts'
import * as State from '../../packages/main-process/src/parts/ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const window = new BrowserWindow({ height: 700, width: 1000 })
  const view = new WebContentsView()
  const wc = view.webContents
  const id = wc.id
  State.add(id, window, view)
  window.contentView.addChildView(view)
  view.setBounds({ x: 0, y: 0, width: 500, height: 500 })
  await wc.loadURL(
    'data:text/html,<input value="draft"><script>window.count=0;window.token=String(Math.random());setInterval(()=>count++,10)</script>',
  )
  const read = async (): Promise<number> => {
    const { result } = await wc.debugger.sendCommand('Runtime.evaluate', { expression: 'count', returnByValue: true })
    return result.value
  }
  wc.debugger.attach()
  const token = await wc.executeJavaScript('token')
  await delay(150)
  const active = await read()
  assert.ok(active > 5)
  Views.hide(id)
  await BrowserFreeze.setHidden(id, true, true)
  const frozen = await read()
  await delay(200)
  assert.equal(await read(), frozen, 'hidden timer must stop completely')
  await Views.show(id)
  await delay(150)
  assert.ok((await read()) > frozen)
  assert.equal(await wc.executeJavaScript('token'), token)
  assert.equal(await wc.executeJavaScript('document.querySelector("input").value'), 'draft')
  // Overlay-only hides do not change logical tab visibility.
  Views.hide(id)
  const overlay = await read()
  await delay(1200)
  assert.ok((await read()) > overlay)
  await BrowserFreeze.setHidden(id, true, true)
  await BrowserFreeze.setHidden(id, true, false)
  const disabled = await read()
  await delay(1200)
  assert.ok((await read()) > disabled)
  for (let i = 0; i < 10; i++) {
    const hiding = BrowserFreeze.setHidden(id, true, true)
    const showing = Views.show(id)
    await Promise.all([hiding, showing])
  }
  const switched = await read()
  await delay(150)
  assert.ok((await read()) > switched)
  await wc.executeJavaScript(
    `window.audio = new AudioContext(); window.osc = audio.createOscillator(); osc.connect(audio.destination); osc.start(); audio.resume()`,
    true,
  )
  for (let i = 0; i < 100 && !wc.isCurrentlyAudible(); i++) await delay(50)
  assert.equal(wc.isCurrentlyAudible(), true, 'test audio must be audible')
  Views.hide(id)
  await BrowserFreeze.setHidden(id, true, true)
  const audible = await read()
  await delay(150)
  assert.ok((await read()) > audible, 'audible background tab must keep running')
  await Views.setAudioMuted(view, true)
  await delay(200)
  const muted = await read()
  await delay(150)
  assert.equal(await read(), muted, 'muted media is eligible for freezing')
  await Views.setAudioMuted(view, false)
  await delay(150)
  await wc.executeJavaScript('osc.stop()')
  for (let i = 0; i < 100 && wc.isCurrentlyAudible(); i++) await delay(50)
  assert.equal(wc.isCurrentlyAudible(), false)
  await delay(100)
  const silent = await read()
  await delay(150)
  assert.equal(await read(), silent, 'tab freezes when sound stops')
  await Views.show(id)
  await wc.executeJavaScript(
    `
    window.videoOsc = audio.createOscillator();
    window.destination = audio.createMediaStreamDestination();
    videoOsc.connect(destination); videoOsc.start();
    window.canvas = document.createElement('canvas');
    window.video = document.createElement('video');
    video.srcObject = new MediaStream([...canvas.captureStream().getVideoTracks(), ...destination.stream.getAudioTracks()]);
    document.body.append(video); void video.play(); canvas.getContext('2d').fillRect(0,0,100,100)
  `,
    true,
  )
  for (let i = 0; i < 100 && !wc.isCurrentlyAudible(); i++) await delay(50)
  assert.equal(wc.isCurrentlyAudible(), true, 'video fixture must play sound')
  Views.hide(id)
  await BrowserFreeze.setHidden(id, true, true)
  const videoCount = await read()
  await delay(150)
  assert.ok((await read()) > videoCount, 'video with sound must remain active')
  await wc.executeJavaScript('video.pause(); videoOsc.stop()')
  await Views.show(id)
  await wc.loadURL('data:text/html,<script>window.count=0;setInterval(()=>count++,10)</script>')
  Views.hide(id)
  await BrowserFreeze.setHidden(id, true, true)
  await wc.loadURL('data:text/html,<script>window.count=0;setInterval(()=>count++,10)</script>')
  await delay(100)
  const navigated = await read()
  await delay(150)
  assert.equal(await read(), navigated, 'a navigation in a hidden tab remains frozen')
  wc.openDevTools({ mode: 'detach' })
  for (let i = 0; i < 100 && !wc.isDevToolsOpened(); i++) await delay(50)
  await delay(200)
  if (!wc.debugger.isAttached()) wc.debugger.attach()
  const inspected = await read()
  await delay(1200)
  assert.ok((await read()) > inspected, 'DevTools must not leave the page frozen')
  wc.closeDevTools()
  await delay(300)
  if (!wc.debugger.isAttached()) wc.debugger.attach()
  const reinspected = await read()
  await delay(150)
  assert.equal(await read(), reinspected, 'hidden page freezes again after DevTools closes')
  wc.close()
  State.remove(id)
  await BrowserFreeze.setHidden(id, false, false)
  window.destroy()
  console.log('PASS: timers freeze, drafts resume, overlays stay active, audible media continues, silence freezes, rapid switching and disposal work')
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
