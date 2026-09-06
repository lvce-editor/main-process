import type { Rpc } from '@lvce-editor/rpc'
import type { BrowserWindow, WebContents } from 'electron'
import * as DoubleControlGesture from '../DoubleControlGesture/DoubleControlGesture.ts'

const windows = new Map<number, { attach(contents: WebContents): void; setEnabled(enabled: boolean): void }>()

export const setEnabled = (windowId: number, enabled: boolean): void => {
  windows.get(windowId)?.setEnabled(enabled)
}

export const attach = (window: BrowserWindow, contents: WebContents): void => {
  windows.get(window.id)?.attach(contents)
}

export const listen = (window: BrowserWindow, rpc: Rpc): (() => void) => {
  const gesture = DoubleControlGesture.create()
  const disposers = new Map<WebContents, () => void>()
  let enabled = false
  let pending: ReturnType<typeof setImmediate> | undefined
  const reset = (): void => {
    gesture.reset()
    if (pending) {
      clearImmediate(pending)
      pending = undefined
    }
  }
  const attachContents = (contents: WebContents): void => {
    if (disposers.has(contents)) {
      return
    }
    const handleInput = (_event: unknown, input: DoubleControlGesture.ControlInput): void => {
      if (!enabled || !window.isFocused()) {
        reset()
        return
      }
      if (gesture.accept(input, performance.now())) {
        // Deliver the key release before moving focus to another WebContents.
        pending = setImmediate(() => {
          pending = undefined
          if (enabled && !contents.isDestroyed() && contents.isFocused() && window.isFocused()) {
            rpc.send('Window.handleBrowserFullWidthGesture')
          }
        })
      }
    }
    const dispose = (): void => {
      reset()
      contents.off('before-input-event', handleInput)
      contents.off('before-mouse-event', reset)
      contents.off('blur', reset)
      contents.off('focus', reset)
      contents.off('destroyed', dispose)
      disposers.delete(contents)
    }
    contents.on('before-input-event', handleInput)
    contents.on('before-mouse-event', reset)
    contents.on('blur', reset)
    contents.on('focus', reset)
    contents.once('destroyed', dispose)
    disposers.set(contents, dispose)
  }
  windows.set(window.id, {
    attach: attachContents,
    setEnabled(value): void {
      reset()
      enabled = value
    },
  })
  attachContents(window.webContents)
  window.on('blur', reset)
  const dispose = (): void => {
    enabled = false
    reset()
    for (const disposeContents of disposers.values()) {
      disposeContents()
    }
    window.off('blur', reset)
    window.off('closed', dispose)
    windows.delete(window.id)
  }
  window.once('closed', dispose)
  return dispose
}
