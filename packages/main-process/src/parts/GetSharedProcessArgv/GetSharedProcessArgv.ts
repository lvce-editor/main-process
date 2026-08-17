export const getSharedProcessArgv = (argv: readonly string[]): readonly string[] => {
  return argv.slice(1)
}

export const getSharedProcessExecArgv = (isProduction: boolean): readonly string[] => {
  if (isProduction) {
    return ['--enable-source-maps']
  }
  return []
}
