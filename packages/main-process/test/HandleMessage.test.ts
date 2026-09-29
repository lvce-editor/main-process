import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/JsonRpc/JsonRpc.ts', () => ({
  handleJsonRpcMessage: jest.fn(),
}))

const JsonRpc = await import('../src/parts/JsonRpc/JsonRpc.ts')
const HandleMessage = await import('../src/parts/HandleMessage/HandleMessage.ts')

test('handleMessage - ignores MessagePort ready signal', async () => {
  await HandleMessage.handleMessage({ data: 'ready' })
  expect(JsonRpc.handleJsonRpcMessage).not.toHaveBeenCalled()
})

test('handleMessage - handles JSON-RPC messages', async () => {
  const event = { data: { jsonrpc: '2.0', method: 'test' }, target: {} }
  await HandleMessage.handleMessage(event)
  expect(JsonRpc.handleJsonRpcMessage).toHaveBeenCalledWith(
    event.target,
    event.data,
    expect.any(Function),
    expect.any(Function),
    expect.any(Function),
    expect.any(Function),
    expect.any(Function),
  )
})
