interface CloseEvent {
  preventDefault(): void
}

interface ClosableWindow {
  close(): void
  off(event: 'close', listener: (event: CloseEvent) => void): void
}

interface RendererRpc {
  invoke(method: 'Window.prepareClose'): Promise<unknown>
}

const closePreparationTimeout = 1000

const prepareClose = async (rpc: RendererRpc): Promise<void> => {
  let timeout: NodeJS.Timeout | undefined
  try {
    await Promise.race([
      rpc.invoke('Window.prepareClose'),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`Timed out preparing window close after ${closePreparationTimeout}ms`))
        }, closePreparationTimeout)
      }),
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

export const createWindowCloseHandler = (
  window: ClosableWindow,
  rpc: RendererRpc,
  onError: (error: unknown) => void,
  dispose: () => void = (): void => {},
): ((event: CloseEvent) => void) => {
  let closePending = false

  const handleWindowClose = (event: CloseEvent): void => {
    event.preventDefault()
    if (closePending) {
      return
    }
    closePending = true

    void (async (): Promise<void> => {
      try {
        await prepareClose(rpc)
      } catch (error) {
        onError(error)
      } finally {
        try {
          dispose()
        } catch (error) {
          onError(error)
        }
        window.off('close', handleWindowClose)
        window.close()
      }
    })()
  }

  return handleWindowClose
}
