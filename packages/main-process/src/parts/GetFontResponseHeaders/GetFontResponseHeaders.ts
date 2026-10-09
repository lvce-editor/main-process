import * as Platform from '../Platform/Platform.ts'

const addFontSource = (policy: string): string => {
  const directives = policy.split(';').map((directive) => directive.trim())
  const fontIndex = directives.findIndex((directive) => /^font-src(?:\s|$)/i.test(directive))
  const fallback = directives.find((directive) => /^default-src(?:\s|$)/i.test(directive))
  const fontDirective = fontIndex === -1 ? fallback : directives[fontIndex]
  if (!fontDirective) {
    return policy
  }
  const sources = fontDirective
    .split(/\s+/)
    .slice(1)
    .filter((source) => source !== "'none'")
  sources.push(`${Platform.fontScheme}:`)
  const directive = `font-src ${sources.join(' ')}`
  if (fontIndex === -1) {
    directives.push(directive)
  } else {
    directives[fontIndex] = directive
  }
  return directives.filter(Boolean).join('; ')
}

export const getFontResponseHeaders = (responseHeaders: Record<string, string[]> = {}): Record<string, string[]> => {
  const headers = { ...responseHeaders }
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === 'content-security-policy') {
      headers[key] = headers[key].map(addFontSource)
    }
  }
  return headers
}
