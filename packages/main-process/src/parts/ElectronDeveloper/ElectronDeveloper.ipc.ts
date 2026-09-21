import * as Developer from './ElectronDeveloper.ts'

export const name = 'ElectronDeveloper'

export const Commands = {
  crashMainProcess: Developer.crashMainProcess,
  getPerformanceEntries: Developer.getPerformanceEntries,
  takeRendererHeapSnapshot: Developer.takeRendererHeapSnapshot,
  takeWindowCpuProfile: Developer.takeWindowCpuProfile,
  takeWorkerCpuProfile: Developer.takeWorkerCpuProfile,
  takeWorkerHeapSnapshot: Developer.takeWorkerHeapSnapshot,
}
