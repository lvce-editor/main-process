import { execFile } from 'node:child_process'
import { renameSync } from 'node:fs'
import { lstat, mkdir, mkdtemp, readdir, realpath, rm } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

export interface StagedUpdate {
  readonly appPath: string
  readonly backupPath: string
  readonly stagedPath: string
  readonly version: string
}

type Run = (command: string, args: readonly string[]) => Promise<{ stdout: string; stderr: string }>

const run: Run = async (command, args) => exec(command, [...args], { maxBuffer: 1024 * 1024, timeout: 120_000 })

const readInfo = async (appPath: string, execute: Run): Promise<Record<string, string>> => {
  const { stdout } = await execute('/usr/bin/plutil', ['-convert', 'json', '-o', '-', join(appPath, 'Contents/Info.plist')])
  return JSON.parse(stdout)
}

const validateBundle = async (stagedPath: string, appPath: string, version: string, arch: string, execute: Run): Promise<void> => {
  const current = await readInfo(appPath, execute)
  const next = await readInfo(stagedPath, execute)
  if (!current.CFBundleIdentifier || next.CFBundleIdentifier !== current.CFBundleIdentifier || next.CFBundleShortVersionString !== version) {
    throw new Error('Update bundle identity or version does not match')
  }
  if (!next.CFBundleExecutable || basename(next.CFBundleExecutable) !== next.CFBundleExecutable) {
    throw new Error('Invalid update executable')
  }
  const executable = join(stagedPath, 'Contents/MacOS', next.CFBundleExecutable)
  const { stdout: executableInfo } = await execute('/usr/bin/file', ['-b', executable])
  const architecture = arch === 'x64' ? /\bx86_64\b/ : /\barm64\b/
  if (!executableInfo.includes('Mach-O') || !architecture.test(executableInfo)) {
    throw new Error('Update executable architecture does not match')
  }
  await execute('/usr/bin/codesign', ['--verify', '--deep', '--strict', stagedPath])
  const currentSignature = await execute('/usr/bin/codesign', ['-dv', '--verbose=4', appPath])
  const nextSignature = await execute('/usr/bin/codesign', ['-dv', '--verbose=4', stagedPath])
  const currentTeam = /^TeamIdentifier=(.+)$/m.exec(currentSignature.stderr)?.[1]
  const nextTeam = /^TeamIdentifier=(.+)$/m.exec(nextSignature.stderr)?.[1]
  if (currentTeam && currentTeam !== 'not set' && nextTeam !== currentTeam) {
    throw new Error('Update signing team does not match the installed app')
  }
}

export const stageUpdate = async (diskImage: string, version: string, appPath: string, arch: string, execute: Run = run): Promise<StagedUpdate> => {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !['arm64', 'x64'].includes(arch)) {
    throw new Error('Invalid update version or architecture')
  }
  if (!appPath.endsWith('.app') || appPath.startsWith('/Volumes/') || appPath.includes('/AppTranslocation/')) {
    throw new Error('Move LVCE Editor to a writable Applications folder before updating')
  }
  if ((await realpath(appPath)) !== appPath) {
    throw new Error('Updating through an application symlink is not supported')
  }
  if (!isAbsolute(diskImage) || !(await lstat(diskImage)).isFile()) {
    throw new Error('Update disk image must be a regular local file')
  }
  const directory = await mkdtemp(join(dirname(appPath), '.lvce-update-'))
  const mountPath = join(directory, 'mount')
  const stagedPath = join(directory, 'next.app')
  let mounted = false
  let staged = false
  try {
    await mkdir(mountPath)
    await execute('/usr/bin/hdiutil', ['attach', '-nobrowse', '-readonly', '-mountpoint', mountPath, diskImage])
    mounted = true
    try {
      const applications = (await readdir(mountPath)).filter((name) => name.endsWith('.app'))
      if (applications.length !== 1 || !(await lstat(join(mountPath, applications[0]))).isDirectory()) {
        throw new Error('Update disk image must contain exactly one application bundle')
      }
      await execute('/usr/bin/ditto', [join(mountPath, applications[0]), stagedPath])
      await validateBundle(stagedPath, appPath, version, arch, execute)
    } finally {
      await execute('/usr/bin/hdiutil', ['detach', mountPath])
      mounted = false
    }
    await rm(mountPath, { recursive: true })
    staged = true
    return { appPath, backupPath: join(directory, 'previous.app'), stagedPath, version }
  } finally {
    // Never recursively remove a directory while its disk image may still be mounted.
    if (!mounted && !staged) {
      await rm(directory, { force: true, recursive: true })
    }
  }
}

export const applyUpdate = (update: StagedUpdate, rename: typeof renameSync = renameSync, onApplied: () => void = () => {}): void => {
  rename(update.appPath, update.backupPath)
  let replaced = false
  try {
    rename(update.stagedPath, update.appPath)
    replaced = true
    onApplied()
  } catch (error) {
    try {
      if (replaced) {
        rename(update.appPath, update.stagedPath)
      }
      rename(update.backupPath, update.appPath)
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], `Update failed; restore the previous app from ${update.backupPath}`)
    }
    throw error
  }
}
