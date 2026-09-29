import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import * as Path from '../Path/Path.ts'
import * as Platform from '../Platform/Platform.ts'

const maximumDimension = 10_000
export interface WindowState {
  height: number
  maximized: boolean
  width: number
}

interface WindowBounds {
  height: number
  width: number
}

interface TrackableWindow {
  getBounds(): WindowBounds
  isMaximized(): boolean
  off(event: 'move' | 'resize', listener: () => void): void
  on(event: 'move' | 'resize', listener: () => void): void
}

export const trackWindowState = (window: TrackableWindow): { getState: () => WindowState; dispose: () => void } => {
  let normalBounds = window.getBounds()
  const updateBounds = (): void => {
    if (!window.isMaximized()) {
      normalBounds = window.getBounds()
    }
  }
  window.on('move', updateBounds)
  window.on('resize', updateBounds)
  return {
    dispose: () => {
      window.off('move', updateBounds)
      window.off('resize', updateBounds)
    },
    getState: () => ({ height: normalBounds.height, maximized: window.isMaximized(), width: normalBounds.width }),
  }
}

export const parseWindowState = (content: string): WindowState | undefined => {
  try {
    const value = JSON.parse(content)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined
    }
    const { height, maximized, width } = value
    if (
      typeof width !== 'number' ||
      !Number.isFinite(width) ||
      width <= 0 ||
      width > maximumDimension ||
      typeof height !== 'number' ||
      !Number.isFinite(height) ||
      height <= 0 ||
      height > maximumDimension ||
      typeof maximized !== 'boolean'
    ) {
      return undefined
    }
    return { height, maximized, width }
  } catch {
    return undefined
  }
}

export const readWindowState = async (): Promise<WindowState | undefined> => {
  try {
    const content = await readFile(Platform.windowStatePath, 'utf8')
    return parseWindowState(content)
  } catch {
    return undefined
  }
}

export const writeWindowState = async (state: WindowState): Promise<void> => {
  const temporaryPath = `${Platform.windowStatePath}.${randomUUID()}.tmp`
  try {
    await mkdir(Path.dirname(Platform.windowStatePath), { recursive: true })
    await writeFile(temporaryPath, `${JSON.stringify(state)}\n`)
    await rename(temporaryPath, Platform.windowStatePath)
  } catch {
    // Window state is best-effort and must never prevent application shutdown.
  }
}
