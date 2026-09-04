import { safeStorage } from 'electron'
import * as EncodingType from '../EncodingType/EncodingType.ts'
import * as Platform from '../Platform/Platform.ts'

const ensureEncryptionAvailable = (): void => {
  if (!safeStorage.isEncryptionAvailable() && Platform.isLinux) {
    safeStorage.setUsePlainTextEncryption(true)
  }
}

export const isEncryptionAvailable = () => {
  return safeStorage.isEncryptionAvailable()
}

export const encrypt = (plainText) => {
  ensureEncryptionAvailable()
  return safeStorage.encryptString(plainText).toString(EncodingType.Base64)
}

export const decrypt = (encrypted) => {
  ensureEncryptionAvailable()
  const buffer = Buffer.from(encrypted, EncodingType.Base64)
  return safeStorage.decryptString(buffer)
}
