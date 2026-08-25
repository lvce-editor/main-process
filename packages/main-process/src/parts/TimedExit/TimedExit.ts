import * as CliCommandType from '../CliCommandType/CliCommandType.ts'
import * as Exit from '../Exit/Exit.ts'

const exitDelay = 10_000

export const schedule = (parsedCliArgs: Readonly<Record<string, unknown>>): boolean => {
  if (!parsedCliArgs[CliCommandType.Wait10Seconds]) {
    return false
  }
  setTimeout(Exit.exit, exitDelay)
  return true
}
