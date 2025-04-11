import * as CliCommandType from '../CliCommandType/CliCommandType.ts'
import * as CliModuleId from '../CliModuleId/CliModuleId.ts'

export const getCliModuleId = (parsedArgs: any): number => {
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
    return CliModuleId.SharedProcess
  }
  return CliModuleId.None
}
