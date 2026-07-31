import { createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto'

const chromeV10Prefix = Buffer.from('v10')
const chromeV11Prefix = Buffer.from('v11')
const chromeV10Key = pbkdf2Sync('peanuts', 'saltysalt', 1, 16, 'sha1')
const chromeV10Iv = Buffer.alloc(16, 0x20)
const domainHashLength = 32

export class UnsupportedChromeCookieEncryptionError extends Error {
  constructor() {
    super('Unsupported Chrome cookie encryption format')
    this.name = 'UnsupportedChromeCookieEncryptionError'
  }
}

export const isV11 = (encryptedValue: Uint8Array): boolean => {
  return Buffer.from(encryptedValue).subarray(0, chromeV11Prefix.length).equals(chromeV11Prefix)
}

export const decrypt = (hostKey: string, encryptedValue: Uint8Array, databaseVersion: number, chromeSafeStoragePassword?: string): string => {
  const buffer = Buffer.from(encryptedValue)
  if (buffer.length <= chromeV10Prefix.length) {
    throw new UnsupportedChromeCookieEncryptionError()
  }
  const prefix = buffer.subarray(0, chromeV10Prefix.length)
  let key: Buffer
  if (prefix.equals(chromeV10Prefix)) {
    key = chromeV10Key
  } else if (prefix.equals(chromeV11Prefix) && chromeSafeStoragePassword !== undefined) {
    key = pbkdf2Sync(chromeSafeStoragePassword, 'saltysalt', 1, 16, 'sha1')
  } else {
    throw new UnsupportedChromeCookieEncryptionError()
  }
  const decipher = createDecipheriv('aes-128-cbc', key, chromeV10Iv)
  const plaintext = Buffer.concat([decipher.update(buffer.subarray(prefix.length)), decipher.final()])
  if (databaseVersion < 24) {
    return plaintext.toString('utf8')
  }
  if (plaintext.length < domainHashLength) {
    throw new Error('Chrome cookie domain integrity check failed')
  }
  const expectedDomainHash = createHash('sha256').update(hostKey).digest()
  const actualDomainHash = plaintext.subarray(0, domainHashLength)
  if (!actualDomainHash.equals(expectedDomainHash)) {
    throw new Error('Chrome cookie domain integrity check failed')
  }
  return plaintext.subarray(domainHashLength).toString('utf8')
}
