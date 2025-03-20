export const getSharedProcessArgv = (isProduction: boolean) => {
  if (isProduction) {
    return ['--enable-source-maps']
  }
  return []
}
