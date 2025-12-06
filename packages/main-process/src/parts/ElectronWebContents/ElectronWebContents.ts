import { webContents } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as DisposeWebContents from '../DisposeWebContents/DisposeWebContents.ts'

export const getStats = (webContentsId) => {
  Assert.number(webContentsId)
  const contents = webContents.fromId(webContentsId)
  if (!contents) {
    return undefined
  }
  const canGoBack = contents.navigationHistory.canGoBack()
  const canGoForward = contents.navigationHistory.canGoForward()
  const url = contents.getURL()
  const title = contents.getTitle()
  return {
    canGoBack,
    canGoForward,
    title,
    url,
  }
}

export const dispose = (webContentsId) => {
  Assert.number(webContentsId)
  const contents = webContents.fromId(webContentsId)
  if (!contents) {
    return
  }
  DisposeWebContents.disposeWebContents(contents)
}

export const callFunction = (webContentsId, functionName, ...args) => {
  Assert.number(webContentsId)
  Assert.string(functionName)
  const contents = webContents.fromId(webContentsId)
  if (!contents) {
    return
  }
  contents[functionName](...args)
}
