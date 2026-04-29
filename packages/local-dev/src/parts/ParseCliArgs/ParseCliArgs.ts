export type LocalDevCommand = 'prepare' | 'run'

export interface ParsedCliArgs {
  readonly build: boolean
  readonly command: LocalDevCommand
  readonly electronArgs: readonly string[]
  readonly lvceVersion: string
}

const getCommand = (args: readonly string[]): LocalDevCommand => {
  if (args[0] === 'prepare' || args[0] === 'run') {
    return args[0]
  }
  return 'run'
}

export const parseCliArgs = (args: readonly string[]): ParsedCliArgs => {
  const command = getCommand(args)
  const actualArgs = command === args[0] ? args.slice(1) : args
  const passthroughIndex = actualArgs.indexOf('--')
  const optionArgs = passthroughIndex === -1 ? actualArgs : actualArgs.slice(0, passthroughIndex)
  const electronArgs = passthroughIndex === -1 ? [] : actualArgs.slice(passthroughIndex + 1)
  let build = true
  let lvceVersion = 'latest'
  for (let i = 0; i < optionArgs.length; i++) {
    const arg = optionArgs[i]
    if (arg === '--no-build') {
      build = false
      continue
    }
    if (arg === '--lvce-version') {
      lvceVersion = optionArgs[i + 1] || 'latest'
      i++
      continue
    }
    throw new Error(`Unknown argument ${arg}`)
  }
  return {
    build,
    command,
    electronArgs,
    lvceVersion,
  }
}