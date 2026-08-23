import { expect, jest, test } from '@jest/globals'

const calls: string[] = []

jest.unstable_mockModule('../src/parts/App/App.ts', () => ({
  async hydrate(): Promise<void> {
    calls.push('hydrate')
  },
}))

jest.unstable_mockModule('../src/parts/AppPaths/AppPaths.ts', () => ({
  configure: jest.fn(() => {
    calls.push('configure')
  }),
}))

jest.unstable_mockModule('../src/parts/Argv/Argv.ts', () => ({
  argv: [],
  prepend: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/ArgvConfig/ArgvConfig.ts', () => ({
  async load(): Promise<readonly string[]> {
    calls.push('load')
    return []
  },
}))

jest.unstable_mockModule('../src/parts/CommandMap/CommandMap.ts', () => ({
  commandMap: {},
}))

jest.unstable_mockModule('../src/parts/CommandMapRef/CommandMapRef.ts', () => ({
  commandMapRef: {},
}))

jest.unstable_mockModule('../src/parts/ErrorHandling/ErrorHandling.ts', () => ({
  handleUncaughtExceptionMonitor: jest.fn(),
  handleUnhandledRejection: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/Platform/Platform.ts', () => ({
  crashDumpsPath: '/test/config/lvce/electron/Crashpad',
  electronSessionDataPath: '/test/cache/lvce/userdata',
  electronUserDataPath: '/test/config/lvce/electron',
  getArgvConfigPath: () => '/test/config/lvce/argv.json',
  isLinux: true,
  logsDir: '/test/state/lvce/logs',
}))

jest.unstable_mockModule('../src/parts/Process/Process.ts', () => ({
  on: jest.fn(),
}))

jest.unstable_mockModule('../src/parts/SetStackTraceLimit/SetStackTraceLimit.ts', () => ({
  setStackTraceLimit: jest.fn(),
}))

const AppPaths = await import('../src/parts/AppPaths/AppPaths.ts')
const Main = await import('../src/parts/Main/Main.ts')

test('configures Electron paths before reading configuration', async () => {
  await Main.main()

  expect(calls).toEqual(['configure', 'load', 'hydrate'])
  expect(AppPaths.configure).toHaveBeenCalledWith({
    crashDumpsPath: '/test/config/lvce/electron/Crashpad',
    logsPath: '/test/state/lvce/logs',
    sessionDataPath: '/test/cache/lvce/userdata',
    userDataPath: '/test/config/lvce/electron',
  })
})
