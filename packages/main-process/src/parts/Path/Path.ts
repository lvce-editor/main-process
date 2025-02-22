import * as NodePath from 'node:path'
import * as Root from '../Root/Root.ts'

export const absolute = (relativePath) => {
  return NodePath.join(Root.root, relativePath)
}

export const join = (...paths) => {
  return NodePath.join(...paths)
}
