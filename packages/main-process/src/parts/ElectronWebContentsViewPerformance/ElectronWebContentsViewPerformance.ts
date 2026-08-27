import * as ElectronWebContentsEventType from '../ElectronWebContentsEventType/ElectronWebContentsEventType.ts'

interface WebContentsWithNavigation {
  readonly executeJavaScript: (code: string) => Promise<unknown>
  readonly on: (event: string, listener: (event: unknown, url: string) => void) => unknown
}

interface TimerGlobal {
  readonly location: {
    readonly hostname: string
  }
  setTimeout: (callback: unknown, delay?: number, ...args: unknown[]) => unknown
}

export const installSoundCloudTimerOptimization = (target: TimerGlobal): void => {
  const hostname = target.location.hostname
  if (hostname !== 'soundcloud.com' && !hostname.endsWith('.soundcloud.com')) {
    return
  }
  const marker = '__lvceSoundCloudTimerOptimization'
  if (Object.hasOwn(target, marker)) {
    return
  }
  const originalSetTimeout = target.setTimeout.bind(target)
  Object.defineProperty(target, marker, { value: true })
  target.setTimeout = (callback, delay, ...args) => {
    // SoundCloud polls its player position at 60 Hz, causing a full lifecycle update even though its displayed time has one-second precision.
    const soundCloudPlayerPollingInterval = 1000 / 60
    const optimizedPlayerPollingInterval = 100
    const optimizedDelay = Object.is(delay, soundCloudPlayerPollingInterval) ? optimizedPlayerPollingInterval : delay
    return originalSetTimeout(callback, optimizedDelay, ...args)
  }
}

export const soundCloudTimerOptimizationScript = `(${installSoundCloudTimerOptimization.toString()})(globalThis)`

const isSoundCloudUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)
    return hostname === 'soundcloud.com' || hostname.endsWith('.soundcloud.com')
  } catch {
    return false
  }
}

export const attach = (webContents: WebContentsWithNavigation): void => {
  webContents.on(ElectronWebContentsEventType.DidNavigate, (_event, url) => {
    if (!isSoundCloudUrl(url)) {
      return
    }
    void webContents.executeJavaScript(soundCloudTimerOptimizationScript).catch(() => {})
  })
}
