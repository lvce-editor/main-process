import { beforeEach, expect, jest, test } from '@jest/globals'

const mockCreate = jest.fn()

jest.unstable_mockModule('@lvce-editor/rpc', () => ({
  ElectronUtilityProcessRpcParent: {
    create: mockCreate,
  },
}))

const CreateElectronUtilityProcessRpc = await import('../src/parts/CreateElectronUtilityProcessRpc/CreateElectronUtilityProcessRpc.ts')
const UtilityProcessState = await import('../src/parts/UtilityProcessState/UtilityProcessState.ts')

beforeEach(() => {
  jest.resetAllMocks()
  UtilityProcessState.state.all = Object.create(null)
})

test('createElectronUtilityProcessRpc - tracks utility process until exit', async () => {
  let handleExit: (() => void) | undefined
  const rawIpc = {
    off: jest.fn(),
    on: jest.fn((event: string, listener: () => void) => {
      if (event === 'exit') {
        handleExit = listener
      }
    }),
    pid: 123,
  }
  const rpc = {
    ipc: {
      _rawIpc: rawIpc,
    },
  }
  mockCreate.mockImplementation(async () => rpc)

  const result = await CreateElectronUtilityProcessRpc.createElectronUtilityProcessRpc({
    name: 'File System Process',
  })

  expect(result).toBe(rpc)
  expect(UtilityProcessState.getAll()).toEqual([
    [
      '123',
      {
        name: 'file-system-process',
        process: rawIpc,
      },
    ],
  ])

  handleExit?.()

  expect(UtilityProcessState.getAll()).toEqual([])
  expect(rawIpc.off).toHaveBeenCalledWith('exit', handleExit)
})

test('createElectronUtilityProcessRpc - ignores rpc without process id', async () => {
  const rpc = {
    ipc: {
      _rawIpc: {},
    },
  }
  mockCreate.mockImplementation(async () => rpc)

  await CreateElectronUtilityProcessRpc.createElectronUtilityProcessRpc({
    name: 'File System Process',
  })

  expect(UtilityProcessState.getAll()).toEqual([])
})
