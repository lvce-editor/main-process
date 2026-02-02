import { join } from 'node:path'
import { getActualPath } from '../GetActualPath/GetActualPath.ts'
import { root } from '../Root/Root.ts'

export const getAbsolutePath = (relative: string) => {
  const actual = getActualPath(relative)
  const absolutePath = join(root, 'static', actual)
  return absolutePath
}
