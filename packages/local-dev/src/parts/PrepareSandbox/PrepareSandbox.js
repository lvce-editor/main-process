import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as GetGeneratedPackageJson from '../GetGeneratedPackageJson/GetGeneratedPackageJson.js'
import * as GetStaticAssetRoot from '../GetStaticAssetRoot/GetStaticAssetRoot.js'
import * as GetWorkspaceRoot from '../GetWorkspaceRoot/GetWorkspaceRoot.js'

const runCommand = async (command, args, cwd) => {
  const { spawn } = await import('node:child_process')
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
    })
  })
}

const readJson = async (path) => {
  const content = await readFile(path, 'utf8')
  return JSON.parse(content)
}

const writeJson = async (path, value) => {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n')
}

const ensureLink = async (target, source) => {
  await rm(target, { force: true, recursive: true })
  await symlink(source, target, process.platform === 'win32' ? 'junction' : 'dir')
}

const copyDirectory = async (from, to) => {
  await rm(to, { force: true, recursive: true })
  await cp(from, to, { recursive: true })
}

const getSandboxRoot = () => {
  return join(GetWorkspaceRoot.workspaceRoot, '.tmp', 'local-dev', `${process.platform}-${process.arch}`)
}

const getLocalDistRoot = () => {
  return join(GetWorkspaceRoot.workspaceRoot, '.tmp', 'dist')
}

const getElectronDistPath = (sandboxRoot) => {
  return join(sandboxRoot, 'node_modules', 'electron', 'dist')
}

const writePackageJsonIfNeeded = async (sandboxRoot, packageJson) => {
  const packageJsonPath = join(sandboxRoot, 'package.json')
  if (!existsSync(packageJsonPath)) {
    await writeJson(packageJsonPath, packageJson)
    return true
  }
  const existing = await readJson(packageJsonPath)
  if (JSON.stringify(existing) === JSON.stringify(packageJson)) {
    return false
  }
  await writeJson(packageJsonPath, packageJson)
  return true
}

const ensureSandboxDependencies = async (sandboxRoot) => {
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

const prepareLayout = async (sandboxRoot) => {
  const sharedProcessPackagePath = join(sandboxRoot, 'node_modules', '@lvce-editor', 'shared-process')
  const staticServerPackagePath = join(sandboxRoot, 'node_modules', '@lvce-editor', 'static-server')
  const staticPath = join(staticServerPackagePath, 'static')
  const staticEntries = await readdir(staticPath)
  const assetRoot = GetStaticAssetRoot.getStaticAssetRoot(staticPath, staticEntries)
  const localDistRoot = getLocalDistRoot()

  await copyDirectory(join(localDistRoot, 'dist'), join(sandboxRoot, 'dist'))
  await copyDirectory(join(localDistRoot, 'pages'), join(sandboxRoot, 'pages'))
  await copyDirectory(join(sharedProcessPackagePath, 'src'), join(sandboxRoot, 'src'))

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

export const prepareSandbox = async ({ build, lvceVersion }) => {
  const sandboxRoot = getSandboxRoot()
  const localDistRoot = getLocalDistRoot()

  if (build) {
    await runCommand('npm', ['run', 'build'], GetWorkspaceRoot.workspaceRoot)
  }

  const localPackageJson = await readJson(join(localDistRoot, 'package.json'))
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
