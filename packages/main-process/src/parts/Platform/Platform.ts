import { homedir, tmpdir } from 'node:os'
import * as Path from '../Path/Path.ts'
import * as Root from '../Root/Root.ts'

const { env, platform } = process

export const isLinux = platform === 'linux'

export const isProduction = false

const homeDirectory = homedir()

export const applicationName = 'lvce-oss'

const xdgCache = env.XDG_CACHE_HOME || (homeDirectory ? Path.join(homeDirectory, '.cache') : undefined)

const xdgData = env.XDG_DATA_HOME || (homeDirectory ? Path.join(homeDirectory, '.local', 'share') : undefined)

const dataDir = Path.join(xdgData || tmpdir(), applicationName)

export const getBuiltinSelfTestPath = () => {
  return process.env.BUILTIN_SELF_TEST_PATH || Path.join(Root.root, 'extensions', 'builtin.self-test', 'bin', 'SelfTest.ts')
}

export const getWebPath = () => {
  return process.env.WEB_PATH || Path.join(Root.root, 'packages', 'web', 'src', 'web.ts')
}

export const chromeUserDataPath = xdgCache ? Path.join(xdgCache, applicationName, 'userdata') : ''

export const version = '0.0.0-dev'

export const commit = 'unknown commit'

export const scheme = 'lvce-oss'

export const useIpcForResponse = true

export const getSessionId = () => {
  return process.env.SESSION_ID || `persist:${scheme}`
}

export const getSharedProcessPath = () => {
  if (process.env.LVCE_SHARED_PROCESS_PATH) {
    return process.env.LVCE_SHARED_PROCESS_PATH
  }
  if (isProduction) {
    return Path.join(Root.root, 'packages', 'shared-process', 'src', 'sharedProcessMain.ts')
  }
  return Path.join(Root.root, 'packages', 'shared-process', 'src', 'sharedProcessMain.ts')
}

export const getChromeExtensionsPath = () => {
  return Path.join(dataDir, 'electron-browser-view-chrome-extensions')
}
