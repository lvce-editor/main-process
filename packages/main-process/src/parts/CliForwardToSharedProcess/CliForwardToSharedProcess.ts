import * as ErrorHandling from '../ErrorHandling/ErrorHandling.ts'
import * as Exit from '../Exit/Exit.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as Process from '../Process/Process.ts'
import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const handleCliArgs = async (parsedArgs: any): Promise<void> => {
  try {
    await SharedProcess.invoke('HandleCliArgs.handleCliArgs', parsedArgs)
  } catch (error) {
    Process.setExitCode(ExitCode.Error)
    if (error && error instanceof Error && error.stack && error.stack.includes('shared-process')) {
      // ignore
    } else {
      ErrorHandling.handleError(error)
    }
  } finally {
    Exit.exit()
  }
}
