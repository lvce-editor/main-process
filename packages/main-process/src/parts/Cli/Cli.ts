import * as CliCommandType from '../CliCommandType/CliCommandType.ts'
import * as CliForwardToSharedProcess from '../CliForwardToSharedProcess/CliForwardToSharedProcess.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'

/**
 * @enum {number}
 */
const ModuleId = {
  SharedProcess: 4,
  None: 0,
}

const getModule = (moduleId: number): any => {
  switch (moduleId) {
    case ModuleId.SharedProcess:
      return CliForwardToSharedProcess
    default:
      throw new Error('module not found')
  }
}

const getModuleId = (parsedArgs: any): number => {
  const arg0 = parsedArgs._[0]
  if (
    arg0 === CliCommandType.Install ||
    arg0 === CliCommandType.List ||
    arg0 === CliCommandType.Link ||
    arg0 === CliCommandType.Unlink ||
    parsedArgs[CliCommandType.Status] ||
    parsedArgs[CliCommandType.Version] ||
    parsedArgs[CliCommandType.Help] ||
    parsedArgs[CliCommandType.Web] ||
    parsedArgs[CliCommandType.BuiltinSelfTest]
  ) {
    return ModuleId.SharedProcess
  }
  return ModuleId.None
}

const handleArgs = (moduleId: number, parsedArgs: any): any => {
  const module = getModule(moduleId)
  return module.handleCliArgs(parsedArgs)
}

export const handleFastCliArgsMaybe = async (parsedArgs: any): Promise<boolean> => {
  const moduleId = getModuleId(parsedArgs)
  if (moduleId) {
    await ElectronApp.whenReady()
    return handleArgs(moduleId, parsedArgs)
  }
  return false
}
