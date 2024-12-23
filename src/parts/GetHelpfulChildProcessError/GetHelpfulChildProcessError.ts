import * as GetModulesErrorStack from '../GetModulesErrorStack/GetModulesErrorStack.ts'
import * as SplitLines from '../SplitLines/SplitLines.ts'

const RE_NATIVE_MODULE_ERROR = /^innerError Error: Cannot find module '.*.node'/
const RE_NATIVE_MODULE_ERROR_2 = /was compiled against a different Node.js version/

const RE_MASSAGE_CODE_BLOCK_START = /^Error: The module '.*'$/
const RE_MASSAGE_CODE_BLOCK_END = /^\s* at/

const RE_IMPORTED_FROM_ERROR = /Cannot find module .* imported from (.*)/

const isUnhelpfulNativeModuleError = (stderr: string): boolean => {
  return RE_NATIVE_MODULE_ERROR.test(stderr) && RE_NATIVE_MODULE_ERROR_2.test(stderr)
}

const isMessageCodeBlockStartIndex = (line: string): boolean => {
  return RE_MASSAGE_CODE_BLOCK_START.test(line)
}

const isMessageCodeBlockEndIndex = (line: string): boolean => {
  return RE_MASSAGE_CODE_BLOCK_END.test(line)
}

const getMessageCodeBlock = (stderr: string): string => {
  const lines = SplitLines.splitLines(stderr)
  const startIndex = lines.findIndex(isMessageCodeBlockStartIndex)
  const endIndex = startIndex + lines.slice(startIndex).findIndex(isMessageCodeBlockEndIndex, startIndex)
  const relevantLines = lines.slice(startIndex, endIndex)
  const relevantMessage = relevantLines.join(' ').slice('Error: '.length)
  return relevantMessage
}

const getNativeModuleErrorMessage = (stderr: string) => {
  const message = getMessageCodeBlock(stderr)
  // TODO extract stack from stderr
  return new Error(`Incompatible native node module: ${message}`)
}

const getErrorMessage = (firstLine: string): string => {
  return firstLine
}

const getImportPath = (firstLine: string): string => {
  if (!firstLine) {
    return ''
  }
  const match = firstLine.match(RE_IMPORTED_FROM_ERROR)
  if (!match) {
    return ''
  }
  return match[1]
}

const getOtherError = (stderr: string): Error => {
  const stackLines = GetModulesErrorStack.getModulesErrorStack(stderr)
  const firstLine = getErrorMessage(stackLines[0])
  const importPath = getImportPath(firstLine)
  if (importPath) {
    stackLines.splice(1, 0, `    at ${importPath}`)
  }
  const error = new Error(firstLine)
  error.stack = stackLines.join('\n')
  return error
}

export const getHelpfulChildProcessError = (message: any, stdout: any, stderr: string): Error => {
  if (isUnhelpfulNativeModuleError(stderr)) {
    return getNativeModuleErrorMessage(stderr)
  }
  return getOtherError(stderr)
}
