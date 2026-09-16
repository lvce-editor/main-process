import { expect, test } from '@jest/globals'
import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { applyUpdate, stageUpdate } from '../src/parts/MacUpdate/MacUpdate.ts'

const exec = promisify(execFile)

const createApp = async (path: string, version: string): Promise<void> => {
  await mkdir(join(path, 'Contents/MacOS'), { recursive: true })
  await copyFile('/usr/bin/true', join(path, 'Contents/MacOS/Fixture'))
  await writeFile(
    join(path, 'Contents/Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.lvce.update-test</string>
<key>CFBundleExecutable</key><string>Fixture</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
</dict></plist>`,
  )
  await exec('/usr/bin/codesign', ['--force', '--sign', '-', path])
}

test('stages and replaces a real signed app from a DMG using macOS tools', async () => {
  if (process.platform !== 'darwin') {
    return
  }
  const directory = await mkdtemp(join(tmpdir(), 'lvce-update-integration-'))
  const root = await realpath(directory)
  try {
    const appPath = join(root, 'Installed.app')
    const source = join(root, 'source')
    const diskImage = join(root, 'update.dmg')
    await createApp(appPath, '0.115.14')
    await createApp(join(source, 'Next.app'), '0.115.15')
    await exec('/usr/bin/hdiutil', ['create', '-srcfolder', source, '-format', 'UDZO', diskImage])

    // The system fixture is universal x86_64/arm64e; validate its x86_64 slice without executing it.
    const update = await stageUpdate(diskImage, '0.115.15', appPath, 'x64')
    expect(await readFile(join(appPath, 'Contents/Info.plist'), 'utf8')).toContain('0.115.14')
    applyUpdate(update)
    expect(await readFile(join(appPath, 'Contents/Info.plist'), 'utf8')).toContain('0.115.15')
    expect(await readFile(join(update.backupPath, 'Contents/Info.plist'), 'utf8')).toContain('0.115.14')
  } finally {
    await rm(root, { force: true, recursive: true })
  }
}, 60_000)
