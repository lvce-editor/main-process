import { Console } from 'node:console'
import { createWriteStream, mkdirSync } from 'node:fs'
import * as Path from '../Path/Path.ts'
import * as Platform from '../Platform/Platform.ts'

export const createFileLogger = (fileName: string): Console => {
  mkdirSync(Platform.logsDir, {
    recursive: true,
  })
  const logFile = Path.join(Platform.logsDir, fileName)
  const writeStream = createWriteStream(logFile)
  return new Console(writeStream)
}
