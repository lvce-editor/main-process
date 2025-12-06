export const listen = ({ webContentsIpc }) => {
  return webContentsIpc
}

const preloadChannelType = 'port'

const createSyntheticEvent = (event, message) => {
  const { ports, sender } = event
  const data = {
    ...message,
    params: [...message.params, ...ports],
  }
  const target = {
    isDiposed() {
      return this.sender.isDestroyed()
    },
    send(message) {
      this.sender.postMessage(preloadChannelType, message)
    },
    sendAndTransfer(message, transfer) {
      this.sender.postMessage(preloadChannelType, message, transfer)
    },
    sender,
  }
  const syntheticEvent = {
    data,
    target,
  }
  return syntheticEvent
}

export const wrap = (webContentsIpc) => {
  return {
    on(event, listener) {
      const wrappedListener = (event, message) => {
        const syntheticEvent = createSyntheticEvent(event, message)
        listener(syntheticEvent)
      }
      this.webContentsIpc.on(preloadChannelType, wrappedListener)
    },
    send(message) {
      throw new Error('not implemented')
    },
    webContentsIpc,
  }
}
