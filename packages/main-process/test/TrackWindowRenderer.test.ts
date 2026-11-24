import type { WebContents } from 'electron'
import { expect, test } from '@jest/globals'
import { EventEmitter } from 'node:events'
import * as IpcId from '../src/parts/IpcId/IpcId.ts'
import { trackWindowRenderer } from '../src/parts/TrackWindowRenderer/TrackWindowRenderer.ts'

const createWebContents = (isCrashed = () => false) => Object.assign(new EventEmitter(), { ipc: new EventEmitter(), isCrashed, mainFrame: {} })

const connect = (webContents: ReturnType<typeof createWebContents>, senderFrame = webContents.mainFrame, ipcId = IpcId.RendererWorker) => {
  webContents.ipc.emit('port', { senderFrame }, { method: 'CreateMessagePort.createMessagePort', params: [ipcId] })
}

test('waits for the main frame renderer worker connection before using close RPC', () => {
  const webContents = createWebContents()
  const available = trackWindowRenderer(webContents as unknown as WebContents, '/app/preload.js')
  webContents.emit('did-finish-load')
  expect(available()).toBe(false)
  connect(webContents, {})
  connect(webContents, webContents.mainFrame, IpcId.ExtensionHostHelperProcess)
  expect(available()).toBe(false)
  connect(webContents)
  expect(available()).toBe(true)

  webContents.emit('did-frame-navigate', {}, 'lvce://-/frame', 200, 'OK', false)
  expect(available()).toBe(true)
  webContents.emit('did-frame-navigate', {}, 'lvce://-/', 200, 'OK', true)
  expect(available()).toBe(false)
  connect(webContents)
  expect(available()).toBe(true)
})

test('only a failed application preload bypasses renderer close confirmation', () => {
  const webContents = createWebContents()
  const available = trackWindowRenderer(webContents as unknown as WebContents, '/app/preload.js')
  connect(webContents)
  expect(available()).toBe(true)
  webContents.emit('preload-error', {}, '/extension/preload.js')
  expect(available()).toBe(true)
  webContents.emit('preload-error', {}, '/app/preload.js')
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/', false, false)
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/#fragment', true, true)
  expect(available()).toBe(false)
  webContents.emit('did-start-navigation', {}, 'lvce://-/', false, true)
  webContents.emit('did-frame-navigate', {}, 'lvce://-/', 200, 'OK', true)
  connect(webContents)
  expect(available()).toBe(true)
})

test('a crashed renderer cannot answer close confirmation', () => {
  const webContents = createWebContents(() => true)
  const available = trackWindowRenderer(webContents as unknown as WebContents, undefined)
  connect(webContents)
  expect(available()).toBe(false)
})
