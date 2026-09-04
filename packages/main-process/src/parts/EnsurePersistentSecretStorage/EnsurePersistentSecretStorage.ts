import * as ElectronApp from '../ElectronApp/ElectronApp.ts'
import * as ElectronSafeStorage from '../ElectronSafeStorage/ElectronSafeStorage.ts'
import * as ExitCode from '../ExitCode/ExitCode.ts'
import * as Platform from '../Platform/Platform.ts'

const hasPasswordStoreArgument = (argv: readonly string[]): boolean => {
  return argv.some((argument) => argument === '--password-store' || argument.startsWith('--password-store='))
}

export const ensurePersistentSecretStorage = (argv: readonly string[]): boolean => {
  if (!Platform.isLinux || ElectronSafeStorage.isEncryptionAvailable()) {
    return true
  }
  if (hasPasswordStoreArgument(argv)) {
    throw new Error('Persistent secret storage is unavailable')
  }
  ElectronApp.relaunch({
    args: ['--password-store=basic', ...argv.slice(1)],
  })
  ElectronApp.exit(ExitCode.Success)
  return false
}
