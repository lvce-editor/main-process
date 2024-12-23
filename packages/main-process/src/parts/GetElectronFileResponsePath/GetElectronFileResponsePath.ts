import * as GetFileUrl from '../GetFileUrl/GetFileUrl.ts'
import * as HasStaticPrefix from '../HasStaticPrefix/HasStaticPrefix.ts'
import * as Platform from '../Platform/Platform.ts'

const prefix = `${Platform.scheme}://-/`
const prefixLength = prefix.length

/**
 *
 * @param {string} url
 * @returns {string}
 */
export const getElectronFileResponsePath = (url) => {
  if (url.startsWith(prefix)) {
    const filePath = url.slice(prefixLength)
    if (filePath.length === 0) {
      return GetFileUrl.getFileUrl('static/index.html')
    }
    if (HasStaticPrefix.hasStaticPrefix(filePath)) {
      return GetFileUrl.getFileUrl(`static/${filePath}`)
    }
    const fileUrl = GetFileUrl.getFileUrl(filePath)
    return fileUrl
  }
  return ''
}
