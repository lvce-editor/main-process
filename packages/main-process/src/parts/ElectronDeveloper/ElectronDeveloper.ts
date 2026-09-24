import * as Performance from '../Performance/Performance.ts'
export { getWorkerMemoryUsage } from '../GetWorkerMemoryUsage/GetWorkerMemoryUsage.ts'
export { takeWindowCpuProfile, takeWorkerCpuProfile } from '../TakeCpuProfile/TakeCpuProfile.ts'
export { takeWorkerHeapSnapshot } from '../TakeWorkerHeapSnapshot/TakeWorkerHeapSnapshot.ts'
export { takeRendererHeapSnapshot } from '../TakeRendererHeapSnapshot/TakeRendererHeapSnapshot.ts'

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
