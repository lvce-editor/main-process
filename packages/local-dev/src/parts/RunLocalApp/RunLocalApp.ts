import { spawn } from 'node:child_process'
import { join } from 'node:path'
import * as GetElectronPath from '../GetElectronPath/GetElectronPath.ts'
import type { ParsedCliArgs } from '../ParseCliArgs/ParseCliArgs.ts'
import type { PreparedSandbox } from '../PrepareSandbox/PrepareSandbox.ts'

export const runLocalApp = async (
  { electronArgs }: Pick<ParsedCliArgs, 'electronArgs'>,
  { sandboxRoot, sharedProcessPath }: PreparedSandbox,
): Promise<void> => {
  const electronPath = GetElectronPath.getElectronPath(join(sandboxRoot, 'node_modules', 'electron'), process.platform)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(electronPath, ['.', ...electronArgs], {
      cwd: sandboxRoot,
      env: {
        ...process.env,
        BUILTIN_EXTENSIONS_PATH: join(sandboxRoot, 'extensions'),
        DEV: '1',
        LVCE_ROOT: sandboxRoot,
        LVCE_SHARED_PROCESS_PATH: sharedProcessPath,
      },
      stdio: 'inherit',
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0 || code === null) {
        resolve()
        return
      }
      reject(new Error(`Electron exited with code ${code}`))
    })
  })
}