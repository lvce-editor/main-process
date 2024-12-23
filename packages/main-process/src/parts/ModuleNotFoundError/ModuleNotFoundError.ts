import * as ErrorCodes from '../ErrorCodes/ErrorCodes.ts'

export class ModuleNotFoundError extends Error {
  constructor(id) {
    super(`Module ${id} not found`)
    this.name = 'ModuleNotFoundError'
    // @ts-ignore
    this.code = ErrorCodes.E_MODULE_NOT_FOUND
  }
}
