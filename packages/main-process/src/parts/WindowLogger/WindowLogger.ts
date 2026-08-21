import type { WebContents, WebContentsConsoleMessageEventParams } from 'electron'
import type { FileLogger } from '../CreateFileLogger/CreateFileLogger.ts'
import { createFileLogger } from '../CreateFileLogger/CreateFileLogger.ts'

type Logger = Pick<FileLogger, 'log'> & Partial<Pick<FileLogger, 'dispose'>>

export const getLogFileName = (windowId: number, now: number = Date.now()): string => {
  return `${windowId}/${now}.txt`
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

export const addListener = (
  windowId: number,
  webContents: WebContents,
  logger: Logger = createFileLogger(getLogFileName(windowId)),
): void => {
  webContents.on('console-message', (event) => {
    logger.log(formatMessage(event))
  })
  webContents.on('destroyed', () => {
    logger.dispose?.()
  })
}
