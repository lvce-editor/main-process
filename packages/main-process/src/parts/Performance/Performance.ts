export const mark = (key) => {
  performance.mark(key)
}

const toUiEntry = (performanceEntry) => {
  return {
    detail: performanceEntry.detail,
    duration: performanceEntry.duration,
    entryType: performanceEntry.entryType,
    name: performanceEntry.name,
    startTime: performanceEntry.startTime,
  }
}

export const getEntries = () => {
  const entries = performance.getEntries()
  const uiEntries = entries.map(toUiEntry)
  return uiEntries
}

export const clearMarks = () => {
  performance.clearMarks()
}

export const { timeOrigin } = performance
