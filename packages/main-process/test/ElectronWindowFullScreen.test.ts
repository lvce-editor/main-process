import { beforeEach, expect, jest, test } from '@jest/globals'
import EventEmitter from 'node:events'
import * as ElectronWindowFullScreen from '../src/parts/ElectronWindowFullScreen/ElectronWindowFullScreen.ts'

const browserWindow = new EventEmitter()
const rpc = {
  send: jest.fn(),
}

beforeEach(() => {
  browserWindow.removeAllListeners()
  jest.resetAllMocks()
})

test('forwards enter and leave full screen events', () => {
  ElectronWindowFullScreen.listen(browserWindow as any, rpc as any)

  browserWindow.emit('enter-full-screen')
  browserWindow.emit('leave-full-screen')

  expect(rpc.send).toHaveBeenNthCalledWith(1, 'Window.handleFullScreenChange', true)
  expect(rpc.send).toHaveBeenNthCalledWith(2, 'Window.handleFullScreenChange', false)
})

test('disposes full screen event listeners', () => {
  const dispose = ElectronWindowFullScreen.listen(browserWindow as any, rpc as any)

  dispose()
  browserWindow.emit('enter-full-screen')
  browserWindow.emit('leave-full-screen')

  expect(rpc.send).not.toHaveBeenCalled()
})
