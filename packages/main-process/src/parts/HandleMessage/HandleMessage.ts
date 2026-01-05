import * as Callback from '../Callback/Callback.ts'
import { commandMapRef } from '../CommandMapRef/CommandMapRef.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as PrettyError from '../PrettyError/PrettyError.ts'
import * as PrintPrettyError from '../PrintPrettyError/PrintPrettyError.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'

const execute = (method, ...params) => {
  const fn = commandMapRef[method]
  if (!fn) {
    throw new Error(`command not found: ${method}`)
  }
  return fn(...params)
}

const logError = (error, prettyError) => {
  PrintPrettyError.printPrettyError(prettyError, '[main-process] ')
}

export const handleMessage = (event) => {
  return JsonRpc.handleJsonRpcMessage(
    event.target,
    event.data,
    execute,
    Callback.resolve,
    PrettyError.prepare,
    // @ts-ignore
    logError,
    RequiresSocket.requiresSocket,
  )
}
