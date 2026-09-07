export interface ControlInput {
  readonly alt?: boolean
  readonly code: string
  readonly isAutoRepeat?: boolean
  readonly isComposing?: boolean
  readonly meta?: boolean
  readonly shift?: boolean
  readonly type: string
}

export const create = () => {
  let pressedAt = -1
  let releasedAt = -1
  let controlCode = ''
  const heldControls = new Set<string>()
  let overlappingControls = false
  const resetTaps = (): void => {
    pressedAt = -1
    releasedAt = -1
    controlCode = ''
  }
  const reset = (): void => {
    resetTaps()
    heldControls.clear()
    overlappingControls = false
  }
  const hasOverlappingControls = (input: ControlInput, isControl: boolean): boolean => {
    if (isControl && !input.isAutoRepeat) {
      if (input.type === 'keyDown') {
        if (heldControls.size > 0) overlappingControls = true
        heldControls.add(input.code)
      } else if (input.type === 'keyUp') {
        heldControls.delete(input.code)
      }
      if (overlappingControls) {
        resetTaps()
        if (heldControls.size === 0) overlappingControls = false
        return true
      }
    }
    return false
  }
  const accept = (input: ControlInput, now: number): boolean => {
    const isControl = ['ControlLeft', 'ControlRight'].includes(input.code)
    if (hasOverlappingControls(input, isControl)) return false
    if (!isControl || input.alt || input.meta || input.shift || input.isComposing) {
      resetTaps()
      return false
    }
    if (input.isAutoRepeat) {
      return false
    }
    if (input.type === 'keyDown') {
      if (pressedAt !== -1 || controlCode !== input.code || now - releasedAt > 400) {
        resetTaps()
      }
      controlCode = input.code
      pressedAt = now
      return false
    }
    if (input.type !== 'keyUp' || controlCode !== input.code || pressedAt === -1 || now - pressedAt > 250) {
      resetTaps()
      return false
    }
    pressedAt = -1
    if (releasedAt !== -1 && now - releasedAt <= 400) {
      resetTaps()
      return true
    }
    releasedAt = now
    return false
  }
  return { accept, reset }
}
