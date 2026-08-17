export const { argv } = process

export const prepend = (argumentsToPrepend: readonly string[]): void => {
  argv.splice(1, 0, ...argumentsToPrepend)
}
