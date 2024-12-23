import * as Debug from '../Debug/Debug.ts'
import * as LifeCycle from '../LifeCycle/LifeCycle.ts'

// TODO move this function to shared process
export const handleBeforeQuit = () => {
  LifeCycle.setShutDown()
  Debug.debug('[info] before quit')
}
