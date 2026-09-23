import { expect, jest, test } from '@jest/globals'

const rpc = { invoke: jest.fn(), dispose: jest.fn() }
const create = jest.fn<(options: unknown) => Promise<typeof rpc>>(async () => rpc)
const set = jest.fn()
jest.unstable_mockModule('@lvce-editor/rpc', () => ({ ElectronMessagePortRpcClient: { create } }))
jest.unstable_mockModule('@lvce-editor/rpc-registry', () => ({ set }))

const { handleElectronMessagePort } = await import('../src/parts/HandleElectronMessagePort/HandleElectronMessagePort.ts')

test('registers the RPC without returning an uncloneable object over the message port', async () => {
  const port = {}
  const result = await handleElectronMessagePort(port, 42)
  expect(create).toHaveBeenCalledWith(expect.objectContaining({ messagePort: port }))
  expect(set).toHaveBeenCalledWith(42, rpc)
  expect(result).toBeUndefined()
  expect(() => structuredClone(result)).not.toThrow()
})
