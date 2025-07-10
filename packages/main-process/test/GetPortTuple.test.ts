import { test, expect } from '@jest/globals'
import { getPortTuple } from '../src/parts/GetPortTuple/GetPortTuple.js'

test('getPortTuple returns two ports from MessageChannelMain', () => {
  const { port1, port2 } = getPortTuple()

  expect(port1).toBeDefined()
  expect(port2).toBeDefined()
  expect(port1).not.toBe(port2)
})
