import * as SharedProcess from '../SharedProcess/SharedProcess.ts'

export const handleWindowAllClosed = async () => {
  SharedProcess.send('HandleWindowAllClosed.handleWindowAllClosed')
}
