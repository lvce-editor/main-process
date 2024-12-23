import * as Platform from '../Platform/Platform.ts'

export const getSharedProcessArgv = () => {
  if (Platform.isProduction) {
    return ['--enable-source-maps']
  }
  return []
}
