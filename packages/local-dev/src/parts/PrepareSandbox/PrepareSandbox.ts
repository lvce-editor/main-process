import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as GetGeneratedPackageJson from '../GetGeneratedPackageJson/GetGeneratedPackageJson.ts'
import * as GetStaticAssetRoot from '../GetStaticAssetRoot/GetStaticAssetRoot.ts'
import * as GetWorkspaceRoot from '../GetWorkspaceRoot/GetWorkspaceRoot.ts'
import * as PatchSandboxBundles from '../PatchSandboxBundles/PatchSandboxBundles.ts'
import type { ParsedCliArgs } from '../ParseCliArgs/ParseCliArgs.ts'

interface LocalDistPackageJson {
  readonly dependencies: {
    readonly electron: string
  }
}

export interface PreparedSandbox {
  readonly assetRoot: string
  readonly sandboxRoot: string
  readonly sharedProcessPath: string
}

const runCommand = async (command: string, args: readonly string[], cwd: string): Promise<void> => {
  const { spawn } = await import('node:child_process')
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
    })
  })
}

const readJson = async <T>(path: string): Promise<T> => {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content) as T
}

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

const patchMainProcessBundle = async (path: string): Promise<void> => {
  const content = await readFile(path, 'utf8')
  const next = PatchSandboxBundles.patchMainProcessBundleContent(content)
  await writeFile(path, next)
}

const patchFile = async (path: string, patch: (content: string) => string): Promise<void> => {
  const content = await readFile(path, 'utf8')
  const next = patch(content)
  await writeFile(path, next)
}

const ensureLink = async (target: string, source: string): Promise<void> => {
  await rm(target, { force: true, recursive: true })
  await symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir')
}

const copyDirectory = async (from: string, to: string): Promise<void> => {
  await rm(to, { force: true, recursive: true })
  await cp(from, to, { recursive: true })
}

const getSandboxRoot = (): string => {
  return join(GetWorkspaceRoot.workspaceRoot, '.tmp', 'local-dev', `${process.platform}-${process.arch}`)
}

const getLocalDistRoot = (): string => {
  return join(GetWorkspaceRoot.workspaceRoot, '.tmp', 'dist')
}

const getElectronDistPath = (sandboxRoot: string): string => {
  return join(sandboxRoot, 'node_modules', 'electron', 'dist')
}

const writePackageJsonIfNeeded = async (sandboxRoot: string, packageJson: GetGeneratedPackageJson.GeneratedPackageJson): Promise<boolean> => {
  const packageJsonPath = join(sandboxRoot, 'package.json')
  if (!existsSync(packageJsonPath)) {
    await writeJson(packageJsonPath, packageJson)
    return true
  }
  const existing = await readJson<GetGeneratedPackageJson.GeneratedPackageJson>(packageJsonPath)
  if (JSON.stringify(existing) === JSON.stringify(packageJson)) {
    return false
  }
  await writeJson(packageJsonPath, packageJson)
  return true
}

const ensureSandboxDependencies = async (sandboxRoot: string): Promise<void> => {
  const packageLockPath = join(sandboxRoot, 'package-lock.json')
  const nodeModulesPath = join(sandboxRoot, 'node_modules')
  if (!existsSync(packageLockPath)) {
    await runCommand('npm', ['install', '--package-lock-only'], sandboxRoot)
  }
  if (!existsSync(nodeModulesPath)) {
    await runCommand('npm', ['ci'], sandboxRoot)
    return
  }
  if (!existsSync(getElectronDistPath(sandboxRoot))) {
    await runCommand('npm', ['rebuild', 'electron'], sandboxRoot)
  }
}

const prepareLayout = async (sandboxRoot: string): Promise<PreparedSandbox> => {
  const sharedProcessPackagePath = join(sandboxRoot, 'node_modules', '@lvce-editor', 'shared-process')
  const staticServerPackagePath = join(sandboxRoot, 'node_modules', '@lvce-editor', 'static-server')
  const staticPath = join(staticServerPackagePath, 'static')
  const configJsonPath = join(staticServerPackagePath, 'config.json')
  const staticEntries = await readdir(staticPath)
  const assetRoot = GetStaticAssetRoot.getStaticAssetRoot(staticPath, staticEntries)
  const localDistRoot = getLocalDistRoot()
  const mainProcessBundlePath = join(sandboxRoot, 'dist', 'mainProcessMain.js')
  const sharedProcessIsElectronPath = join(sandboxRoot, 'src', 'parts', 'IsElectron', 'IsElectron.js')
  const rendererProcessBundlePath = join(assetRoot, 'packages', 'renderer-process', 'dist', 'rendererProcessMain.js')
  const rendererWorkerBundlePath = join(assetRoot, 'packages', 'renderer-worker', 'dist', 'rendererWorkerMain.js')
  const extensionHostWorkerBundlePath = join(assetRoot, 'packages', 'extension-host-worker', 'dist', 'extensionHostWorkerMain.js')

  await copyDirectory(join(localDistRoot, 'dist'), join(sandboxRoot, 'dist'))
  await copyDirectory(join(localDistRoot, 'pages'), join(sandboxRoot, 'pages'))
  await copyDirectory(join(sharedProcessPackagePath, 'src'), join(sandboxRoot, 'src'))
  await cp(configJsonPath, join(sandboxRoot, 'config.json'))
  await patchMainProcessBundle(mainProcessBundlePath)
  await patchFile(sharedProcessIsElectronPath, PatchSandboxBundles.patchSharedProcessIsElectronContent)
  await patchFile(rendererProcessBundlePath, PatchSandboxBundles.patchRendererProcessBundleContent)
  await patchFile(rendererWorkerBundlePath, PatchSandboxBundles.patchRendererWorkerBundleContent)
  await patchFile(extensionHostWorkerBundlePath, PatchSandboxBundles.patchExtensionHostWorkerBundleContent)

  await mkdir(join(sandboxRoot, 'packages', 'shared-process'), { recursive: true })
  await mkdir(join(sandboxRoot, 'packages'), { recursive: true })
  await ensureLink(join(sandboxRoot, 'packages', 'shared-process', 'node_modules'), join(sandboxRoot, 'node_modules'))
  await ensureLink(join(sandboxRoot, 'packages', 'static-server'), staticServerPackagePath)
  await ensureLink(join(sandboxRoot, 'static'), staticPath)
  await ensureLink(join(sandboxRoot, 'config'), join(assetRoot, 'config'))
  await ensureLink(join(sandboxRoot, 'extensions'), join(assetRoot, 'extensions'))
  return {
    assetRoot,
    sandboxRoot,
    sharedProcessPath: join(sandboxRoot, 'src', 'sharedProcessMain.js'),
  }
}

export const prepareSandbox = async ({ build, lvceVersion }: Pick<ParsedCliArgs, 'build' | 'lvceVersion'>): Promise<PreparedSandbox> => {
  const sandboxRoot = getSandboxRoot()
  const localDistRoot = getLocalDistRoot()

  if (build) {
    await runCommand('npm', ['run', 'build'], GetWorkspaceRoot.workspaceRoot)
  }

  const localPackageJson = await readJson<LocalDistPackageJson>(join(localDistRoot, 'package.json'))
  const electronVersion = localPackageJson.dependencies.electron
  const generatedPackageJson = GetGeneratedPackageJson.getGeneratedPackageJson(electronVersion, lvceVersion)

  await mkdir(sandboxRoot, { recursive: true })
  const changed = await writePackageJsonIfNeeded(sandboxRoot, generatedPackageJson)
  if (changed) {
    await rm(join(sandboxRoot, 'node_modules'), { force: true, recursive: true })
    await rm(join(sandboxRoot, 'package-lock.json'), { force: true })
  }
  await ensureSandboxDependencies(sandboxRoot)
  return prepareLayout(sandboxRoot)
}
