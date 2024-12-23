import { desktopCapturer } from 'electron'
import * as Assert from '../Assert/Assert.ts'
import * as SerializeDesktopCapturerSources from '../SerializeDesktopCapturerSources/SerializeDesktopCapturerSources.ts'
import { VError } from '../VError/VError.ts'

export const getSources = async (options: any): Promise<any> => {
  try {
    Assert.object(options)
    const sources = await desktopCapturer.getSources(options)
    const serializedSources = SerializeDesktopCapturerSources.serializeDeskopCapturerSources(sources)
    return serializedSources
  } catch (error) {
    throw new VError(error, `Failed to get desktop capturer sources`)
  }
}
