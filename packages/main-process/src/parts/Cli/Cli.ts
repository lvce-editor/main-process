import * as CliForwardToSharedProcess from '../CliForwardToSharedProcess/CliForwardToSharedProcess.ts'
import * as CliModuleId from '../CliModuleId/CliModuleId.ts'
import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as GetCliModuleId from '../GetCliModuleId/GetCliModuleId.ts'

const getModule = (moduleId: number): any => {
  switch (moduleId) {
    case CliModuleId.SharedProcess:
      return CliForwardToSharedProcess
    default:
      throw new Error('module not found')
  }
}

const handleArgs = (moduleId: number, parsedArgs: any): any => {
  const module = getModule(moduleId)
  return module.handleCliArgs(parsedArgs)
}

export const canHandleFastCliArgs = (parsedArgs: any): number => {
  const moduleId = GetCliModuleId.getCliModuleId(parsedArgs)
  return moduleId
}

export const handleFastCliArgs = async (moduleId: number, parsedArgs: any): Promise<boolean> => {
  if (moduleId) {
    await ElectronApp.whenReady()
    return handleArgs(moduleId, parsedArgs)
  }
  return false
}
