import * as Key from '../Key/Key.js'
import * as KeyCode from '../KeyCode/KeyCode.js'

export const getKeyCode = (key) => {
  switch (key) {
    case Key.Backspace:
      return KeyCode.Backspace
    case Key.Tab:
      return KeyCode.Tab
    case Key.Escape:
      return KeyCode.Escape
    case Key.Enter:
      return KeyCode.Enter
    case Key.Space:
      return KeyCode.Space
    case Key.PageUp:
      return KeyCode.PageUp
    case Key.PageDown:
      return KeyCode.PageDown
    case Key.End:
      return KeyCode.End
    case Key.Home:
      return KeyCode.Home
    case Key.LeftArrow:
      return KeyCode.LeftArrow
    case Key.UpArrow:
      return KeyCode.UpArrow
    case Key.RightArrow:
      return KeyCode.RightArrow
    case Key.DownArrow:
      return KeyCode.DownArrow
    case Key.Insert:
      return KeyCode.Insert
    case Key.Delete:
      return KeyCode.Delete
    case Key.Digit0:
      return KeyCode.Digit0
    case Key.Digit1:
      return KeyCode.Digit1
    case Key.Digit2:
      return KeyCode.Digit2
    case Key.Digit3:
      return KeyCode.Digit3
    case Key.Digit4:
      return KeyCode.Digit4
    case Key.Digit5:
      return KeyCode.Digit5
    case Key.Digit6:
      return KeyCode.Digit6
    case Key.Digit7:
      return KeyCode.Digit7
    case Key.Digit8:
      return KeyCode.Digit8
    case Key.Digit9:
      return KeyCode.Digit9
    case Key.KeyA:
      return KeyCode.KeyA
    case Key.KeyB:
      return KeyCode.KeyB
    case Key.KeyC:
      return KeyCode.KeyC
    case Key.KeyD:
      return KeyCode.KeyD
    case Key.KeyE:
      return KeyCode.KeyE
    case Key.KeyF:
      return KeyCode.KeyF
    case Key.KeyG:
      return KeyCode.KeyG
    case Key.KeyH:
      return KeyCode.KeyH
    case Key.KeyI:
      return KeyCode.KeyI
    case Key.KeyJ:
      return KeyCode.KeyJ
    case Key.KeyK:
      return KeyCode.KeyK
    case Key.KeyL:
      return KeyCode.KeyL
    case Key.KeyM:
      return KeyCode.KeyM
    case Key.KeyN:
      return KeyCode.KeyN
    case Key.KeyO:
      return KeyCode.KeyO
    case Key.KeyP:
      return KeyCode.KeyP
    case Key.KeyQ:
      return KeyCode.KeyQ
    case Key.KeyR:
      return KeyCode.KeyR
    case Key.KeyS:
      return KeyCode.KeyS
    case Key.KeyT:
      return KeyCode.KeyT
    case Key.KeyU:
      return KeyCode.KeyU
    case Key.KeyV:
      return KeyCode.KeyV
    case Key.KeyW:
      return KeyCode.KeyW
    case Key.KeyX:
      return KeyCode.KeyX
    case Key.KeyY:
      return KeyCode.KeyY
    case Key.KeyZ:
      return KeyCode.KeyZ
    case Key.F1:
      return KeyCode.F1
    case Key.F2:
      return KeyCode.F2
    case Key.F3:
      return KeyCode.F3
    case Key.F4:
      return KeyCode.F4
    case Key.F5:
      return KeyCode.F5
    case Key.F6:
      return KeyCode.F6
    case Key.F7:
      return KeyCode.F7
    case Key.F8:
      return KeyCode.F8
    case Key.F9:
      return KeyCode.F9
    case Key.F10:
      return KeyCode.F10
    case Key.F11:
      return KeyCode.F11
    case Key.F12:
      return KeyCode.F12
    case Key.F13:
      return KeyCode.F13
    case Key.F14:
      return KeyCode.F14
    case Key.F15:
      return KeyCode.F15
    case Key.F16:
      return KeyCode.F16
    case Key.F17:
      return KeyCode.F17
    case Key.F18:
      return KeyCode.F18
    case Key.F19:
      return KeyCode.F19
    case Key.F20:
      return KeyCode.F20
    case Key.F21:
      return KeyCode.F21
    case Key.F22:
      return KeyCode.F22
    case Key.F23:
      return KeyCode.F23
    case Key.F24:
      return KeyCode.F24
    case Key.SemiColon:
      return KeyCode.SemiColon
    case Key.Equal:
      return KeyCode.Equal
    case Key.Comma:
      return KeyCode.Comma
    case Key.Minus:
      return KeyCode.Minus
    case Key.Period:
      return KeyCode.Period
    case Key.Slash:
      return KeyCode.Slash
    case Key.Backquote:
      return KeyCode.Backquote
    case Key.BracketLeft:
      return KeyCode.BracketLeft
    case Key.Backslash:
      return KeyCode.Backslash
    case Key.BracketRight:
      return KeyCode.BracketRight
    case Key.Quote:
      return KeyCode.Quote
    case Key.Star:
      return KeyCode.Star
    case Key.Plus:
      return KeyCode.Plus
    default:
      return KeyCode.Unknown
  }
}