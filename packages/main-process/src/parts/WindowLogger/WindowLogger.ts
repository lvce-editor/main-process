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
  return JSON.stringify({
    category: 'Window',
    level,
    line: lineNumber,
    message,
    source: sourceId,
    timestamp: new Date().toISOString(),
  })
}

export const addListener = (webContents: WebContents, logger: Pick<Console, 'log'> = getOrCreateLogger()): void => {
  webContents.on('console-message', (event) => {
    logger.log(formatMessage(event))
  })
}
