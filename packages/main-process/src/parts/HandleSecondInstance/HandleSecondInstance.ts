import * as Cli from '../Cli/Cli.ts'
import * as HandleElectronReady from '../HandleElectronReady/HandleElectronReady.ts'
import * as ParseCliArgs from '../ParseCliArgs/ParseCliArgs.ts'

export const handleSecondInstance = async (
  event,
  commandLine,
  workingDirectory,
  additionalData, // additionalData is the actual process.argv https://github.com/electron/electron/pull/30891
) => {
  const parsedArgs = ParseCliArgs.parseCliArgs(additionalData)
  const moduleId = Cli.canHandleFastCliArgs(parsedArgs)
  const handled = await Cli.handleFastCliArgs(moduleId, parsedArgs) // TODO don't like the side effect here
  if (handled) {
    return
  }
  await HandleElectronReady.handleReady(parsedArgs, workingDirectory)
}
