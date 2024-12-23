import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const handleReady = async (parsedArgs, workingDirectory) => {
  await SharedProcess.invoke('HandleElectronReady.handleElectronReady', parsedArgs, workingDirectory)
}
