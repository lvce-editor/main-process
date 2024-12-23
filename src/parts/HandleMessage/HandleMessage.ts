import * as Callback from '../Callback/Callback.ts'
import * as Command from '../Command/Command.ts'
import * as JsonRpc from '../JsonRpc/JsonRpc.ts'
import * as PrettyError from '../PrettyError/PrettyError.ts'
import * as PrintPrettyError from '../PrintPrettyError/PrintPrettyError.ts'
import * as RequiresSocket from '../RequiresSocket/RequiresSocket.ts'

const logError = (error, prettyError) => {
  PrintPrettyError.printPrettyError(prettyError, '[main-process] ')
}

export const handleMessage = (event) => {
  return JsonRpc.handleJsonRpcMessage(
    event.target,
    event.data,
    Command.execute,
    Callback.resolve,
    PrettyError.prepare,
    // @ts-ignore
    logError,
    RequiresSocket.requiresSocket,
  )
}
