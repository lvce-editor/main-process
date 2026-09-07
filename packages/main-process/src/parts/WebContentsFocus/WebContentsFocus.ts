import type { WebContents } from 'electron'

const focusTimes = new WeakMap<WebContents, number>()

export const attach = (contents: WebContents): void => {
  if (focusTimes.has(contents)) return
  focusTimes.set(contents, 0)
  contents.on('focus', () => focusTimes.set(contents, Date.now()))
}

export const getLastFocusedAt = (contents: WebContents): number => focusTimes.get(contents) || 0
