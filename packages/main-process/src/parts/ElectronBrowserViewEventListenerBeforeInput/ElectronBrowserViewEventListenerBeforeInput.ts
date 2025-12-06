import * as ElectronInputType from '../ElectronInputType/ElectronInputType.ts'
import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'
import * as ElectronWebContentsViewState from '../ElectronWebContentsViewState/ElectronWebContentsViewState.ts'
import * as GetKeyBindingIdentifier from '../GetKeyBindingIdentifier/GetKeyBindingIdentifier.ts'

export const key = 'before-input'

export const attach = (webContents, listener): void => {
  webContents.on(ElectronWebContentsEventType.BeforeInputEvent, listener)
}

export const detach = (webContents, listener): void => {
  webContents.off(ElectronWebContentsEventType.BeforeInputEvent, listener)
}

export const handler = (event, input): any => {
  if (input.type !== ElectronInputType.KeyDown) {
    return {
      messages: [],
      result: undefined,
    }
  }
  const falltroughKeyBindings = ElectronWebContentsViewState.getFallthroughKeyBindings()
  const identifier = GetKeyBindingIdentifier.getKeyBindingIdentifier(input)
  // @ts-ignore
  const matches = falltroughKeyBindings.includes(identifier)
  if (matches) {
    event.preventDefault()
    return {
      messages: [['handleKeyBinding', identifier]],
      result: undefined,
    }
  }
  return {
    messages: [],
    result: undefined,
  }
}
