import * as Promises from '../Promises/Promises.ts'

export const getElectronCallbacks = () => {
  const { promise, resolve } = Promises.withResolvers()
  const handleClick = (menuItem) => {
    resolve({
      data: menuItem,
      type: 'click',
    })
  }
  const handleClose = () => {
    resolve({
      data: undefined,
      type: 'close',
    })
  }
  return {
    handleClick,
    handleClose,
    promise,
  }
}
