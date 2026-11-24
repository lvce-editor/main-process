import type { Rectangle } from 'electron'
import type { WindowState } from './WindowState.ts'

export const getRestoredWindowOptions = (state: WindowState | undefined, workArea: Pick<Rectangle, 'width' | 'height'>): Record<string, unknown> => {
  if (!state) {
    return {}
  }
  return {
    height: Math.min(state.height, workArea.height),
    width: Math.min(state.width, workArea.width),
  }
}
