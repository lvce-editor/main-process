export const { argv } = process

const getInsertionIndex = (): number => {
  if (argv[0].endsWith('dist/electron') || argv[0].endsWith('dist\\electron.exe')) {
    return 2
  }
  return 1
}

export const prepend = (argumentsToPrepend: readonly string[]): void => {
  argv.splice(getInsertionIndex(), 0, ...argumentsToPrepend)
}
