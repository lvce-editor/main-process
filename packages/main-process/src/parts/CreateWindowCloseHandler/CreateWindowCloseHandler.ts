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
        await rpc.invoke('Window.prepareClose')
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
