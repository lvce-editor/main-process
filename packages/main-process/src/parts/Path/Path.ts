import * as NodePath from 'node:path'

export const join = (...paths) => {
  return NodePath.join(...paths)
}
