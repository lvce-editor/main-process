import { expect, test } from '@jest/globals'
import { RpcId } from '@lvce-editor/constants'
import * as IpcId from '../src/parts/IpcId/IpcId.ts'

test('embeds process uses the shared rpc id', () => {
  expect(IpcId.EmbedsProcess).toBe(RpcId.EmbedsProcess)
})
