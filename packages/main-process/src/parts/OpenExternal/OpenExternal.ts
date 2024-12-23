import { shell } from 'electron'
import * as ShouldOpenExternal from '../ShouldOpenExternal/ShouldOpenExternal.ts'
import { VError } from '../VError/VError.ts'

export const openExternal = async (url) => {
  if (!ShouldOpenExternal.shouldOpenExternal(url)) {
    throw new VError(`only http or https urls are allowed`)
  }
  await shell.openExternal(url)
}
