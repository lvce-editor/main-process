import * as CamelCase from '../CamelCase/CamelCase.ts'

export const formatUtilityProcessName = (name) => {
  return CamelCase.camelCase(name)
}
