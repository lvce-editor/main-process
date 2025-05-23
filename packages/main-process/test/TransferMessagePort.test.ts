import { expect, jest, test } from '@jest/globals'
import * as TransferMessagePort from '../src/parts/TransferMessagePort/TransferMessagePort.js'

test('transferMessagePort - error', async () => {
  const ipc = {
    invokeAndTransfer: jest.fn(() => {
      throw new TypeError('x is not a function')
    }),
  }
  const port = {}
  await expect(TransferMessagePort.transferMessagePort(ipc, port)).rejects.toThrow(
    new Error('Failed to send message port to worker thread: TypeError: x is not a function'),
  )
})
