export const connect = async (url: string) => {
  const socket = new WebSocket(url)
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close()
      reject(new Error('Utility inspector connection timed out'))
    }, 10_000)
    socket.addEventListener(
      'open',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
    socket.addEventListener(
      'error',
      () => {
        clearTimeout(timer)
        reject(new Error('Utility inspector connection failed'))
      },
      { once: true },
    )
  })
  let nextId = 0
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>()
  const fail = (error: Error) => {
    for (const request of pending.values()) {
      request.reject(error)
    }
    pending.clear()
  }
  socket.addEventListener('error', () => fail(new Error('Utility inspector connection failed')))
  socket.addEventListener('close', () => fail(new Error('Utility process inspector disconnected')))
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data))
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })
  return {
    close: () => socket.close(),
    invoke: async (method: string): Promise<any> => {
      const id = ++nextId
      const result = Promise.withResolvers<any>()
      const timer = setTimeout(() => {
        pending.delete(id)
        result.reject(new Error(`Inspector command timed out: ${method}`))
      }, 10_000)
      pending.set(id, result)
      socket.send(JSON.stringify({ id, method }))
      try {
        return await result.promise
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
