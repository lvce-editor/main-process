import * as HandleMessage from '../HandleMessage/HandleMessage.ts'

export const handleIpcOnce = (ipc) => {
  ipc.addEventListener('message', HandleMessage.handleMessage, { once: true })
}
