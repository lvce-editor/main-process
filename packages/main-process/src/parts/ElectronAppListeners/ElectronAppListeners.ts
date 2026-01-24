import * as LifeCycle from '../LifeCycle/LifeCycle.ts'

// TODO move this function to shared process
export const handleBeforeQuit = () => {
  LifeCycle.setShutDown()
}
