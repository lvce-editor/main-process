import * as SplitLines from '../SplitLines/SplitLines.ts'

const RE_AT = /^ {4}at /
const RE_JUST_PATH = /^(?:file:\/\/|\/|\\).*:\d+$/
const RE_JUST_MESSAGE = /^\w+/

const isStackLine = (line) => {
  return RE_AT.test(line)
}

const isJustPath = (line) => {
  return RE_JUST_PATH.test(line)
}

const isPartOfMessage = (line) => {
  return RE_JUST_MESSAGE.test(line)
}

const getExtraLines = (lines) => {
  for (const line of lines) {
    if (isJustPath(line)) {
      return [`    at ${line}`]
    }
  }
  return []
}

const getStartIndex = (lines) => {
  return lines.findIndex(isStackLine)
}

const getMessageStartIndex = (lines, startIndex) => {
  let messageStartIndex = startIndex - 1
  for (let i = messageStartIndex; i >= 0; i--) {
    const line = lines[i]
    if (!isPartOfMessage(line)) {
      break
    }
    messageStartIndex = i
  }
  return messageStartIndex
}

const getEndIndex = (lines, startIndex) => {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!isStackLine(line)) {
      return i
    }
  }
  return lines.length - 1
}

const getSyntaxErrorMessageStartIndex = (lines, startIndex, messageStartIndex) => {
  if (messageStartIndex !== startIndex - 1) {
    return messageStartIndex
  }
  for (let i = 0; i < startIndex; i++) {
    const line = lines[i]
    if (line.startsWith('SyntaxError: Named export')) {
      return i
    }
  }
  return messageStartIndex
}

const getMessage = (lines, startIndex, messageStartIndex) => {
  const message = lines.slice(messageStartIndex, startIndex).join(' ')
  if (message !== '') {
    return message
  }
  const syntaxErrorMessageStartIndex = getSyntaxErrorMessageStartIndex(lines, startIndex, messageStartIndex)
  return lines.slice(syntaxErrorMessageStartIndex, startIndex).join(' ').trim()
}

export const getModulesErrorStack = (stderr) => {
  const lines = SplitLines.splitLines(stderr)
  const extraLines = getExtraLines(lines)
  const startIndex = getStartIndex(lines)
  if (startIndex === -1) {
    return []
  }
  const messageStartIndex = getMessageStartIndex(lines, startIndex)
  const endIndex = getEndIndex(lines, startIndex)
  const stackLines = lines.slice(startIndex, endIndex)
  const message = getMessage(lines, startIndex, messageStartIndex)
  return [message, ...extraLines, ...stackLines]
}
