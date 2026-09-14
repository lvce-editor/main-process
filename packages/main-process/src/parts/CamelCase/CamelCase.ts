import * as Character from '../Character/Character.ts'

const firstLetterLowerCase = (string: string): string => {
  if (/^[A-Z][A-Z0-9]*$/.test(string)) {
    return string
  }
  return string[0].toLowerCase() + string.slice(1)
}

export const camelCase = (string: string): string => {
  const parts = string.split(Character.Space)
  const lowerParts = parts.map(firstLetterLowerCase)
  return lowerParts.join(Character.Dash)
}
