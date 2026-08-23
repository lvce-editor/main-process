import { app } from 'electron'
import { mkdirSync } from 'node:fs'

interface AppPathOptions {
  readonly crashDumpsPath: string
  readonly logsPath: string
  readonly sessionDataPath: string
  readonly userDataPath: string
}

export const configure = ({ crashDumpsPath, logsPath, sessionDataPath, userDataPath }: AppPathOptions): void => {
  for (const path of [crashDumpsPath, logsPath, sessionDataPath, userDataPath]) {
    mkdirSync(path, { recursive: true })
  }
  app.setPath('userData', userDataPath)
  app.setPath('sessionData', sessionDataPath)
  app.setPath('crashDumps', crashDumpsPath)
  app.setPath('logs', logsPath)
}
