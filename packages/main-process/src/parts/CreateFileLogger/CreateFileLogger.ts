import { Console } from 'node:console'
import { createWriteStream, mkdirSync } from 'node:fs'
import * as Path from '../Path/Path.ts'
import * as Platform from '../Platform/Platform.ts'

export interface FileLogger extends Console {
  dispose: () => void
}

export const createFileLogger = (fileName: string): FileLogger => {
  const logFile = Path.join(Platform.logsDir, fileName)
  mkdirSync(Path.dirname(logFile), {
    recursive: true,
  })
  const writeStream = createWriteStream(logFile)
  const logger = new Console(writeStream) as FileLogger
  logger.dispose = (): void => {
    writeStream.end()
  }
  return logger
}
