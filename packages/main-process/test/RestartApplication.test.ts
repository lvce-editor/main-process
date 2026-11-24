import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { EventEmitter } from 'node:events'

const app = Object.assign(new EventEmitter(), {
  getPath: jest.fn(() => '/installed/lvce'),
  quit: jest.fn(),
  relaunch: jest.fn(),
})
jest.unstable_mockModule('electron', () => ({ app }))
const { cancel, restart } = await import('../src/parts/RestartApplication/RestartApplication.ts')

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  cancel()
  jest.useRealTimers()
})

test('waits for normal window shutdown before scheduling a relaunch', () => {
  restart()
  restart()
  jest.runAllTimers()
  expect(app.quit).toHaveBeenCalledTimes(1)
  expect(app.relaunch).not.toHaveBeenCalled()
  app.emit('window-all-closed')
  jest.runAllTimers()
  expect(app.quit).toHaveBeenCalledTimes(2)
  app.emit('will-quit')
  expect(app.relaunch).toHaveBeenCalledWith({ args: process.argv.slice(1), execPath: '/installed/lvce' })
  expect(app.listenerCount('will-quit')).toBe(0)
  expect(app.listenerCount('window-all-closed')).toBe(0)
})

test('a cancelled close cannot relaunch the application on a later ordinary quit', () => {
  restart()
  jest.runAllTimers()
  cancel()
  app.emit('will-quit')
  expect(app.relaunch).not.toHaveBeenCalled()
  expect(app.listenerCount('window-all-closed')).toBe(0)
  restart()
  jest.runAllTimers()
  app.emit('will-quit')
  expect(app.relaunch).toHaveBeenCalledTimes(1)
})

test('cancels a pending quit before it runs', () => {
  restart()
  cancel()
  jest.runAllTimers()
  expect(app.quit).not.toHaveBeenCalled()
  expect(app.relaunch).not.toHaveBeenCalled()
})
