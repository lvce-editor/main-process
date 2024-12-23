import * as SerializeDesktopCapturerSource from '../SerializeDesktopCapturerSource/SerializeDesktopCapturerSource.ts'

export const serializeDeskopCapturerSources = (sources) => {
  return sources.map(SerializeDesktopCapturerSource.serializeDeskopCapturerSource)
}
