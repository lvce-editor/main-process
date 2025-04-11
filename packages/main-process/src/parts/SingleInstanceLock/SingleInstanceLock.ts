import { app } from 'electron'

export const requestSingleInstanceLock = (argv: any): boolean => {
  return app.requestSingleInstanceLock(argv)
}
