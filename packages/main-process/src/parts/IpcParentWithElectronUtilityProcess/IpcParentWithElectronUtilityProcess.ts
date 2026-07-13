import { IpcParentWithElectronUtilityProcess } from '@lvce-editor/ipc'
import * as TrackUtilityProcess from '../TrackUtilityProcess/TrackUtilityProcess.ts'

export const { create } = IpcParentWithElectronUtilityProcess

export const { wrap } = IpcParentWithElectronUtilityProcess

export const effects = ({ name, rawIpc }) => {
  TrackUtilityProcess.trackUtilityProcess(rawIpc, name)
}
