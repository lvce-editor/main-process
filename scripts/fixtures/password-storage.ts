import { app, safeStorage } from 'electron'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as Storage from '../../packages/main-process/src/parts/WebsitePasswordStorage/WebsitePasswordStorage.ts'

const main = async (): Promise<void> => {
  await app.whenReady()
  const credential = { origin: 'https://site.test', username: 'alice', password: 'synthetic-password-for-keyring-test' }
  if (process.argv.includes('unavailable')) {
    safeStorage.setUsePlainTextEncryption(true)
    assert.equal(Storage.isAvailable(), false)
    await assert.rejects(Storage.get(credential.origin, credential.username), /keyring/)
    await assert.rejects(Storage.save(credential), /keyring/)
    console.log('PASS: basic_text cannot read or save website passwords')
    return
  }
  assert.equal(safeStorage.getSelectedStorageBackend(), 'gnome_libsecret')
  assert.equal(Storage.isAvailable(), true)
  if (process.argv.includes('save')) {
    await Promise.all([Storage.save(credential), Storage.save({ ...credential, username: 'bob' })])
    const content = await readFile(join(process.env.XDG_CONFIG_HOME!, 'lvce-oss', 'website-passwords.json'), 'utf8')
    assert.equal(content.includes(credential.password), false)
    assert.equal(content.includes(credential.username), false)
    console.log('PASS: real OS keyring encrypts concurrent credentials')
    return
  }
  assert.deepEqual(await Storage.get(credential.origin, credential.username), credential)
  assert.equal((await Storage.list()).length, 2)
  await Storage.save({ ...credential, password: 'changed-synthetic-password' })
  assert.equal((await Storage.get(credential.origin, credential.username))?.password, 'changed-synthetic-password')
  await Storage.remove(credential.origin, credential.username)
  assert.equal(await Storage.get(credential.origin, credential.username), undefined)
  assert.equal((await Storage.list()).length, 1)
  console.log('PASS: real OS keyring restart persistence, update and deletion')
}
main().then(
  () => app.exit(0),
  (error) => {
    console.error(error)
    app.exit(1)
  },
)
