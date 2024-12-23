import * as GetHelpfulChildProcessError from '../GetHelpfulChildProcessError/GetHelpfulChildProcessError.ts'
import { VError } from '../VError/VError.ts'

export class IpcError extends VError {
  constructor(message, stdout = '', stderr = '') {
    if (stdout || stderr) {
      const cause = GetHelpfulChildProcessError.getHelpfulChildProcessError(message, stdout, stderr)
      super(cause, message)
    } else {
      super(message)
    }
    this.name = 'IpcError'
    // @ts-ignore
    this.stdout = stdout
    // @ts-ignore
    this.stderr = stderr
  }
}
