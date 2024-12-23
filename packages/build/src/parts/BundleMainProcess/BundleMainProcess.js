import * as BundleJs from '../BundleJsRollup/BundleJsRollup.js'
import * as Copy from '../Copy/Copy.js'
import * as Path from '../Path/Path.js'
import * as Replace from '../Replace/Replace.js'
import * as Remove from '../Remove/Remove.js'
import { join } from 'path'

export const bundleMainProcess = async ({ cachePath, bundleMainProcess }) => {
  await Copy.copy({
    from: 'packages/main-process/src',
    to: Path.join(cachePath, 'src'),
  })

  await Copy.copy({
    from: `packages/main-process/pages`,
    to: `${cachePath}/pages`,
  })
  await Replace.replace({
    path: `${cachePath}/src/parts/Platform/Platform.js`,
    occurrence: `export const isProduction = false`,
    replacement: `export const isProduction = true`,
  })
  await Replace.replace({
    path: `${cachePath}/src/parts/Root/Root.ts`,
    occurrence: `export const root = join(__dirname, '../../../../..')`,
    replacement: `export const root = join(__dirname, '../../..')`,
  })
  if (bundleMainProcess) {
    await Copy.copy({
      from: 'packages/main-process/node_modules',
      to: Path.join(cachePath, 'node_modules'),
      ignore: ['electron', '@electron', 'rxjs', '@types', 'node-gyp', 'cacache', '.bin'],
    })
    await BundleJs.bundleJs({
      cwd: cachePath,
      from: `./src/mainProcessMain.js`,
      platform: 'node',
      external: ['electron'],
      sourceMap: false,
    })
    await Remove.remove(join(cachePath, 'src'))
    await Remove.remove(join(cachePath, 'node_modules'))
  } else {
    await Replace.replace({
      path: `${cachePath}/src/parts/Root/Root.js`,
      occurrence: `export const root = join(__dirname, '../../..')`,
      replacement: `export const root = join(__dirname, '../../../../..')`,
    })
  }
}
