import { shell } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as ShouldOpenExternal from '../ShouldOpenExternal/ShouldOpenExternal.ts'
import { VError } from '../VError/VError.ts'

export const openExternal = async (url: string): Promise<void> => {
  Assert.string(url)
  if (!ShouldOpenExternal.shouldOpenExternal(url)) {
    throw new VError(`only http or https urls are allowed`)
  }
  await shell.openExternal(url)
}
