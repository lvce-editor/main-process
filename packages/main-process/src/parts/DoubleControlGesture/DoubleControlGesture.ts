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
  const reset = (): void => {
    pressedAt = -1
    releasedAt = -1
    controlCode = ''
  }
  const accept = (input: ControlInput, now: number): boolean => {
    if (!['ControlLeft', 'ControlRight'].includes(input.code) || input.alt || input.meta || input.shift || input.isComposing) {
      reset()
      return false
    }
    if (input.isAutoRepeat) {
      return false
    }
    if (input.type === 'keyDown') {
      if (pressedAt !== -1 || controlCode !== input.code || now - releasedAt > 400) {
        reset()
      }
      controlCode = input.code
      pressedAt = now
      return false
    }
    if (input.type !== 'keyUp' || controlCode !== input.code || pressedAt === -1 || now - pressedAt > 250) {
      reset()
      return false
    }
    pressedAt = -1
    if (releasedAt !== -1 && now - releasedAt <= 400) {
      reset()
      return true
    }
    releasedAt = now
    return false
  }
  return { accept, reset }
}
