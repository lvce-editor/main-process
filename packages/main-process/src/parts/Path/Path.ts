import * as NodePath from 'node:path'

export const join = (...paths) => {
  return NodePath.join(...paths)
}

export const dirname = (path: string): string => {
  return NodePath.dirname(path)
}
