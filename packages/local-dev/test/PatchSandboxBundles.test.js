import * as PatchSandboxBundles from '../src/parts/PatchSandboxBundles/PatchSandboxBundles.js'

test('patchMainProcessBundleContent', () => {
  const content = `const isLinux = platform === 'linux';\nconst isProduction = false;\nconst useIpcForResponse = true;\n`

  const result = PatchSandboxBundles.patchMainProcessBundleContent(content)

  expect(result).toBe(`const isLinux = ${process.platform === 'linux'};\nconst isProduction = true;\nconst useIpcForResponse = false;\n`)
})

test('patchRendererProcessBundleContent', () => {
  const result = PatchSandboxBundles.patchRendererProcessBundleContent('const platform = Remote;')

  expect(result).toBe('const platform = Electron;')
})

test('patchRendererWorkerBundleContent', () => {
  const result = PatchSandboxBundles.patchRendererWorkerBundleContent('const platform = Remote;')

  expect(result).toBe('const platform = Electron$1;')
})

test('patchExtensionHostWorkerBundleContent', () => {
  const content = 'const platform = Remote; // TODO tree-shake this out in production'

  const result = PatchSandboxBundles.patchExtensionHostWorkerBundleContent(content)

  expect(result).toBe('const platform = Electron; // TODO tree-shake this out in production')
})

test('patchRendererWorkerBundleContent throws when pattern is missing', () => {
  expect(() => PatchSandboxBundles.patchRendererWorkerBundleContent('const platform = Web$1;')).toThrow(
    new Error('Failed to patch renderer worker platform'),
  )
})

test('patchRendererProcessBundleContent is idempotent', () => {
  const result = PatchSandboxBundles.patchRendererProcessBundleContent('const platform = Electron;')

  expect(result).toBe('const platform = Electron;')
})

test('patchSharedProcessIsElectronContent', () => {
  const result = PatchSandboxBundles.patchSharedProcessIsElectronContent('export const isElectron = false;')

  expect(result).toBe('export const isElectron = true;')
})
