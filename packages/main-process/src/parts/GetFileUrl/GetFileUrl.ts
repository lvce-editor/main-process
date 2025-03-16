import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as Root from '../Root/Root.ts'

/**
 *
 * @param {string} filePath
 * @returns {string}
 */
export const getFileUrl = (filePath) => {
  const fileUrl = pathToFileURL(join(Root.root, filePath)).toString()
  return fileUrl
}
