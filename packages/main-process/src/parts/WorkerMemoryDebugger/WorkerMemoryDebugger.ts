interface Lease {
  count: number
  readonly owned: boolean
}

const leases = new WeakMap<Electron.Debugger, Lease>()

export const acquire = (debuggerApi: Electron.Debugger): (() => void) => {
  let lease = leases.get(debuggerApi)
  if (!lease || !debuggerApi.isAttached()) {
    const owned = !debuggerApi.isAttached()
    if (owned) debuggerApi.attach()
    lease = { count: 0, owned }
    leases.set(debuggerApi, lease)
  }
  lease.count++
  const current = lease
  return (): void => {
    current.count--
    if (current.count === 0 && leases.get(debuggerApi) === current) {
      leases.delete(debuggerApi)
      if (current.owned && debuggerApi.isAttached()) debuggerApi.detach()
    }
  }
}
