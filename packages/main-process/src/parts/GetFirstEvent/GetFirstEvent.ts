import * as Promises from '../Promises/Promises.ts'

export const getFirstEvent = async (eventEmitter, eventMap) => {
  const { promise, resolve } = Promises.withResolvers()
  const listenerMap = Object.create(null)
  const cleanup = (value) => {
    for (const event of Object.keys(eventMap)) {
      eventEmitter.off(event, listenerMap[event])
    }
    resolve(value)
  }
  for (const [event, type] of Object.entries(eventMap)) {
    const listener = (event) => {
      cleanup({
        event,
        type,
      })
    }
    eventEmitter.on(event, listener)
    listenerMap[event] = listener
  }
  // @ts-ignore
  const { event, type } = await promise
  return { event, type }
}
