import { Console } from 'node:console'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'

// TODO disable logging via environment variable, don't enable logging during tests

const state = {
  /**
   * @type {Console|undefined}
   */
  console: undefined,
}

const createConsole = () => {
  const logFile = `${tmpdir()}/log-main-process.txt`
  const writeStream = createWriteStream(logFile)
  const logger = new Console(writeStream)
  return logger
}

const getOrCreateLogger = () => {
  // @ts-ignore
  state.console ||= createConsole()
  return state.console
}

export const log = (...args) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.log(...args)
  console.log(...args)
}

export const info = (...args) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.info(...args)
  console.info(...args)
}

export const warn = (...args) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.warn(...args)
  console.warn(...args)
}

export const error = (...args) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.error(...args)
  console.error(...args)
}

process.stdout.on('close', () => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.info('stdout closed')
})
process.stdout.on('exit', () => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.info('stdout exited')
})

process.stderr.on('close', () => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.info('stderr closed')
})
process.stderr.on('exit', () => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.info('stderr exited')
})

process.stdout.on('error', (error) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.error(`[main-process] stdout error: ${error.stack}`)
})

process.stderr.on('error', (error) => {
  const logger = getOrCreateLogger()
  // @ts-ignore
  logger.error(`[main-process] stderr error: ${error.stack}`)
})
