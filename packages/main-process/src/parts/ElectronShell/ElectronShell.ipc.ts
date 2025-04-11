import * as Beep from '../Beep/Beep.ts'
import * as OpenExternal from '../OpenExternal/OpenExternal.ts'
import * as ElectronShell from './ElectronShell.ts'

export const name = 'ElectronShell'

export const Commands = {
  beep: Beep.beep,
  openExternal: OpenExternal.openExternal,
  openPath: ElectronShell.showItemInFolder,
  showItemInFolder: ElectronShell.showItemInFolder,
}
