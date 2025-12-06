import { screen } from 'electron'

export const getWidth = () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return primaryDisplay.bounds.width
}

export const getHeight = () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return primaryDisplay.bounds.height
}

export const getBounds = () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return {
    height: primaryDisplay.bounds.height,
    width: primaryDisplay.bounds.width,
  }
}
