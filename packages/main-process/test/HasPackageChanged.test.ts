import { afterAll, expect, jest, test } from '@jest/globals'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = mkdtempSync(join(tmpdir(), 'lvce-package-change-'))
jest.unstable_mockModule('../src/parts/Root/Root.ts', () => ({ root }))
const { hasPackageChanged } = await import('../src/parts/HasPackageChanged/HasPackageChanged.ts')

afterAll(() => rmSync(root, { force: true, recursive: true }))

test('development without a packaged manifest does not require a restart', () => {
  expect(hasPackageChanged()).toBe(false)
})

test('detects an installed build changing while retaining the running manifest', () => {
  const path = join(root, 'config.json')
  writeFileSync(path, JSON.stringify({ commit: 'original', files: {}, headers: [] }))
  expect(hasPackageChanged()).toBe(false)
  writeFileSync(path, JSON.stringify({ commit: 'updated', files: {}, headers: [] }))
  expect(hasPackageChanged()).toBe(true)
  expect(hasPackageChanged()).toBe(true)
  writeFileSync(path, JSON.stringify({ commit: 'original', files: {}, headers: [] }))
  expect(hasPackageChanged()).toBe(false)
})
