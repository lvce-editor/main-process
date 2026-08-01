import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'

const MaxZoomLevel = 3
const MinZoomLevel = -3
const ZoomDelta = 0.2

const getZoomDelta = (input): number => {
  if (!input.control || input.alt || input.meta) {
    return 0
  }
  if (input.key === '+' || input.key === '=') {
    return ZoomDelta
  }
  if (input.key === '-') {
    return -ZoomDelta
  }
  return 0
}

export const handleWebContentsViewZoomKeyBinding = (webContentsId: number, input): boolean => {
  const delta = getZoomDelta(input)
  if (delta === 0) {
    return false
  }
  const state = ElectronWebContentsViewState.get(webContentsId)
  if (!state) {
    return false
  }
  const { webContents } = state.view
  const currentZoomLevel = webContents.getZoomLevel()
  const newZoomLevel = Math.max(MinZoomLevel, Math.min(MaxZoomLevel, currentZoomLevel + delta))
  webContents.setZoomLevel(newZoomLevel)
  return true
}
