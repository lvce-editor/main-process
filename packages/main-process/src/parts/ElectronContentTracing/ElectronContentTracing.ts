import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import * as Path from '../Path/Path.ts'
import * as Platform from '../Platform/Platform.ts'
import { contentTracing } from 'electron'

/**
 * @param { Electron.TraceConfig | Electron.TraceCategoriesAndOptions} options
 */
export const startRecording = async (options) => {
  await contentTracing.startRecording(options)
}

export const stopRecording = async () => {
  const traceDirectory = Path.join(Platform.cacheDir, 'traces')
  await mkdir(traceDirectory, { recursive: true })
  const tracePath = Path.join(traceDirectory, `trace-${randomUUID()}.json`)
  return contentTracing.stopRecording(tracePath)
}
