import * as GetHelpfulChildProcessError from '../GetHelpfulChildProcessError/GetHelpfulChildProcessError.ts'
import { VError } from '../VError/VError.ts'

export class IpcError extends VError {
  stdout: string
  stderr: string

  constructor(message: string, stdout = '', stderr = '') {
    if (stdout || stderr) {
      const cause = GetHelpfulChildProcessError.getHelpfulChildProcessError(message, stdout, stderr)
      super(cause, message)
    } else {
      super(message)
    }
    this.name = 'IpcError'
    this.stdout = stdout
    this.stderr = stderr
  }
}
