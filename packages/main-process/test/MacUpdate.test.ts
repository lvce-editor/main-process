import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { renameSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyUpdate, stageUpdate } from '../src/parts/MacUpdate/MacUpdate.ts'

let root: string
let appPath: string
let diskImage: string
let nextVersion: string
let nextTeam: string
let signatureValid: boolean
const run = jest.fn<(command: string, args: readonly string[]) => Promise<{ stdout: string; stderr: string }>>()

beforeEach(async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lvce-mac-update-test-'))
  root = await realpath(directory)
  appPath = join(root, 'Lvce Editor.app')
  diskImage = join(root, 'update.dmg')
  await mkdir(appPath)
  await writeFile(join(appPath, 'version'), 'old')
  await writeFile(diskImage, 'fixture')
  nextVersion = '0.115.15'
  nextTeam = 'TEAM123'
  signatureValid = true
  run.mockReset()
  run.mockImplementation(async (command, args) => {
    if (command.endsWith('hdiutil') && args[0] === 'attach') {
      const source = join(args[4], 'Lvce Editor.app')
      await mkdir(source)
      await writeFile(join(source, 'version'), 'new')
    }
    if (command.endsWith('ditto')) {
      await cp(args[0], args[1], { recursive: true })
    }
    if (command.endsWith('plutil')) {
      return {
        stderr: '',
        stdout: JSON.stringify({ CFBundleExecutable: 'Electron', CFBundleIdentifier: 'com.lvce', CFBundleShortVersionString: nextVersion }),
      }
    }
    if (command.endsWith('codesign')) {
      if (args[0] === '--verify' && !signatureValid) {
        throw new Error('invalid signature')
      }
      return { stderr: `TeamIdentifier=${args.at(-1) === appPath ? 'TEAM123' : nextTeam}`, stdout: '' }
    }
    return { stderr: '', stdout: '' }
  })
})

afterEach(async () => {
  await rm(root, { force: true, recursive: true })
})

test('stages a verified bundle without replacing the running app, then retains a backup when applied', async () => {
  const staged = await stageUpdate(diskImage, '0.115.15', appPath, 'arm64', run)
  expect(await readFile(join(appPath, 'version'), 'utf8')).toBe('old')
  expect(run).toHaveBeenCalledWith('/usr/bin/lipo', [join(staged.stagedPath, 'Contents/MacOS/Electron'), '-verify_arch', 'arm64'])
  expect(run).toHaveBeenCalledWith('/usr/bin/codesign', ['--verify', '--deep', '--strict', staged.stagedPath])

  applyUpdate(staged)
  expect(await readFile(join(appPath, 'version'), 'utf8')).toBe('new')
  expect(await readFile(join(staged.backupPath, 'version'), 'utf8')).toBe('old')
})

test('restores the old app if replacing it fails', async () => {
  const staged = await stageUpdate(diskImage, '0.115.15', appPath, 'x64', run)
  const rename: typeof renameSync = (source, target) => {
    if (source === staged.stagedPath) {
      throw new Error('rename failed')
    }
    renameSync(source, target)
  }
  expect(() => applyUpdate(staged, rename)).toThrow('rename failed')
  expect(await readFile(join(appPath, 'version'), 'utf8')).toBe('old')
})

test.each(['version', 'signature', 'team'])('rejects invalid %s and leaves the old app intact', async (reason) => {
  if (reason === 'version') {
    nextVersion = '9.9.9'
  } else if (reason === 'signature') {
    signatureValid = false
  } else {
    nextTeam = 'OTHERTEAM'
  }

  await expect(stageUpdate(diskImage, '0.115.15', appPath, 'arm64', run)).rejects.toThrow()
  expect(await readFile(join(appPath, 'version'), 'utf8')).toBe('old')
  expect(run.mock.calls.some(([command, args]) => command.endsWith('hdiutil') && args[0] === 'detach')).toBe(true)
})

test('refuses to update an app running from a mounted volume', async () => {
  await expect(stageUpdate(diskImage, '0.115.15', '/Volumes/Lvce/Lvce.app', 'arm64', run)).rejects.toThrow('Applications folder')
  expect(run).not.toHaveBeenCalled()
})
