import * as ElectronSafeStorage from './ElectronSafeStorage.ts'

export const name = 'ElectronSafeStorage'

export const Commands = {
  decrypt: ElectronSafeStorage.decrypt,
  encrypt: ElectronSafeStorage.encrypt,
  isEncryptionAvailable: ElectronSafeStorage.isEncryptionAvailable,
}
