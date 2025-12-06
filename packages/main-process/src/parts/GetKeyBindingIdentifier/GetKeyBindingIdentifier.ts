import * as GetKeyCode from '../GetKeyCode/GetKeyCode.ts'
import * as KeyModifier from '../KeyModifier/KeyModifier.ts'
import * as NormalizeKey from '../NormalizeKey/NormalizeKey.ts'

export const getKeyBindingIdentifier = (input) => {
  const { alt, control, key, shift } = input
  const modifierControl = control ? KeyModifier.CtrlCmd : 0
  const modifierShift = shift ? KeyModifier.Shift : 0
  const modifierAlt = alt ? KeyModifier.Alt : 0
  const normalizedKey = NormalizeKey.normalizeKey(key)
  const keyCode = GetKeyCode.getKeyCode(normalizedKey)
  const identifier = modifierControl | modifierShift | modifierAlt | keyCode
  return identifier
}
