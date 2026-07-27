import { createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto'

const chromeV10Prefix = Buffer.from('v10')
const chromeV10Key = pbkdf2Sync('peanuts', 'saltysalt', 1, 16, 'sha1')
const chromeV10Iv = Buffer.alloc(16, 0x20)
const domainHashLength = 32

export class UnsupportedChromeCookieEncryptionError extends Error {
  constructor() {
    super('Unsupported Chrome cookie encryption format')
    this.name = 'UnsupportedChromeCookieEncryptionError'
  }
}

export const decrypt = (hostKey: string, encryptedValue: Uint8Array, databaseVersion: number): string => {
  const buffer = Buffer.from(encryptedValue)
  if (buffer.length <= chromeV10Prefix.length || !buffer.subarray(0, chromeV10Prefix.length).equals(chromeV10Prefix)) {
    throw new UnsupportedChromeCookieEncryptionError()
  }
  const decipher = createDecipheriv('aes-128-cbc', chromeV10Key, chromeV10Iv)
  const plaintext = Buffer.concat([decipher.update(buffer.subarray(chromeV10Prefix.length)), decipher.final()])
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
