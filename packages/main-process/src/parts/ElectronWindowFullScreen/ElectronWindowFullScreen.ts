import type { Rpc } from '@lvce-editor/rpc'
import type { BrowserWindow } from 'electron'

export const listen = (browserWindow: BrowserWindow, rpc: Rpc): (() => void) => {
  const handleEnterFullScreen = () => {
    rpc.send('Window.handleFullScreenChange', true)
  }
  const handleLeaveFullScreen = () => {
    rpc.send('Window.handleFullScreenChange', false)
  }
  browserWindow.on('enter-full-screen', handleEnterFullScreen)
  browserWindow.on('leave-full-screen', handleLeaveFullScreen)
  return () => {
    browserWindow.off('enter-full-screen', handleEnterFullScreen)
    browserWindow.off('leave-full-screen', handleLeaveFullScreen)
  }
}
