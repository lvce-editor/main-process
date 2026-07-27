import type { WebContents, WebContentsConsoleMessageEventParams } from 'electron'
import { createFileLogger } from '../CreateFileLogger/CreateFileLogger.ts'

interface State {
  console: Console | undefined
}

const state: State = {
  console: undefined,
}

const getOrCreateLogger = (): Console => {
  state.console ||= createFileLogger('log-window.txt')
  return state.console
}

export const formatMessage = ({ level, lineNumber, message, sourceId }: WebContentsConsoleMessageEventParams): string => {
  const source = sourceId ? ` (${sourceId}:${lineNumber})` : ''
  return `${new Date().toISOString()} [${level}] [Window] ${message}${source}`
}

export const addListener = (webContents: WebContents, logger: Pick<Console, 'log'> = getOrCreateLogger()): void => {
  webContents.on('console-message', (event) => {
    logger.log(formatMessage(event))
  })
}
