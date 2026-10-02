export interface Sample {
  readonly startTime: string
  readonly ticks: number
  readonly timestamp: number
}

export const parse = (stat: string, timestamp: number): Sample | undefined => {
  const end = stat.lastIndexOf(')')
  if (end === -1) return undefined
  const fields = stat
    .slice(end + 2)
    .trim()
    .split(/\s+/)
  const user = Number(fields[11])
  const system = Number(fields[12])
  const startTime = fields[19]
  if (!startTime || !/^\d+$/.test(startTime) || !Number.isSafeInteger(user) || user < 0 || !Number.isSafeInteger(system) || system < 0)
    return undefined
  return { startTime, ticks: user + system, timestamp }
}

// One fully occupied worker thread is 100%, independent of the CPU core count.
export const percentage = (previous: Sample | undefined, current: Sample, ticksPerSecond: number): number | null => {
  if (!previous || previous.startTime !== current.startTime || !Number.isFinite(ticksPerSecond) || ticksPerSecond <= 0) return null
  const elapsed = current.timestamp - previous.timestamp
  const ticks = current.ticks - previous.ticks
  if (elapsed <= 0 || !Number.isFinite(elapsed) || ticks < 0 || !Number.isFinite(ticks)) return null
  // Kernel tick quantization can put a short interval slightly above 100%.
  return Math.min(100, (ticks * 100_000) / ticksPerSecond / elapsed)
}
