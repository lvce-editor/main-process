import * as Performance from '../Performance/Performance.ts'
export { takeWindowCpuProfile, takeWorkerCpuProfile } from '../TakeCpuProfile/TakeCpuProfile.ts'
export { takeWorkerHeapSnapshot } from '../TakeWorkerHeapSnapshot/TakeWorkerHeapSnapshot.ts'

export const getPerformanceEntries = (): any => {
  const entries = Performance.getEntries()
  const { timeOrigin } = Performance
  return {
    entries,
    timeOrigin,
  }
}

export const crashMainProcess = (): void => {
  throw new Error('oops')
}
