import { beforeEach, expect, jest, test } from '@jest/globals'

beforeEach(() => {
  jest.resetAllMocks()
})

jest.unstable_mockModule('electron', () => ({
  net: {
    fetch: jest.fn(),
  },
}))

const electron = await import('electron')
const ElectronNet = await import('../src/parts/ElectronNet/ElectronNet.ts')

test('getJson fetches and parses JSON', async () => {
  const json = ['query', ['query result']]
  // @ts-expect-error
  electron.net.fetch.mockResolvedValue({
    json: jest.fn(async () => json),
    ok: true,
  })

  await expect(ElectronNet.getJson('https://example.com/data.json')).resolves.toEqual(json)
  expect(electron.net.fetch).toHaveBeenCalledWith('https://example.com/data.json')
})

test('getJson rejects non-success responses', async () => {
  // @ts-expect-error
  electron.net.fetch.mockResolvedValue({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
  })

  await expect(ElectronNet.getJson('https://example.com/data.json')).rejects.toThrow(new Error('Failed to fetch JSON: 503 Service Unavailable'))
})
