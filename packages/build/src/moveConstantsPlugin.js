import { createFilter } from '@rollup/pluginutils'

/**
 * A Rollup plugin that moves specific constant declarations to the top of the file
 * after the imports to make them easier to modify during production builds.
 */
export function moveConstantsPlugin(options = {}) {
  const {
    constants = [
      { name: 'scheme', value: "'lvce-oss'" },
      { name: 'applicationName', value: "'lvce-oss'" },
      { name: 'WebView', value: "'lvce-oss-webview'" }
    ],
    include = ['**/*.ts', '**/*.js'],
    exclude = []
  } = options

  const filter = createFilter(include, exclude)

  return {
    name: 'move-constants',
    renderChunk(code, chunk, outputOptions) {
      if (!filter(chunk.fileName)) {
        return null
      }

      let modifiedCode = code
      const constantsToMove = []

      // Find and remove the constant declarations
      for (const constant of constants) {
        const { name, value } = constant
        
        // Pattern to match: const name = value;
        // This handles both single quotes and double quotes
        const pattern = new RegExp(`const\\s+${name}\\s*=\\s*['"]${value.replace(/'/g, '')}['"]\\s*;`, 'g')
        
        if (pattern.test(modifiedCode)) {
          // Remove the original declaration
          modifiedCode = modifiedCode.replace(pattern, '')
          constantsToMove.push({ name, value })
        }
      }

      // If we found constants to move, add them at the top after imports
      if (constantsToMove.length > 0) {
        // Find the position after the last import statement
        const importRegex = /^import\s+.*?;?\s*$/gm
        let lastImportEnd = 0
        let match

        while ((match = importRegex.exec(modifiedCode)) !== null) {
          lastImportEnd = match.index + match[0].length
        }

        // If no imports found, start at the beginning
        if (lastImportEnd === 0) {
          lastImportEnd = 0
        }

        // Build the constants string
        const constantsString = constantsToMove
          .map(({ name, value }) => `const ${name} = ${value};`)
          .join('\n')

        // Insert after imports
        const beforeImports = modifiedCode.slice(0, lastImportEnd)
        const afterImports = modifiedCode.slice(lastImportEnd)

        modifiedCode = `${beforeImports}\n${constantsString}\n${afterImports}`
      }

      return modifiedCode
    }
  }
}
