import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const handleWindowAllClosed = async () => {
  await SharedProcess.send('HandleWindowAllClosed.handleWindowAllClosed')
}
