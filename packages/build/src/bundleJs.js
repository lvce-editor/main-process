import pluginTypeScript from '@babel/preset-typescript'
import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { join } from 'path'
import { rollup } from 'rollup'
import { root } from './root.js'
import { default as commonjs } from '@rollup/plugin-commonjs'

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: join(root, 'packages/main-process/src/mainProcessMain.ts'),
  preserveEntrySignatures: 'strict',
  treeshake: {
    propertyReadSideEffects: false,
  },
  output: {
    file: join(root, '.tmp/dist/dist/mainProcessMain.js'),
    format: 'es',
    freeze: false,
    generatedCode: {
      constBindings: true,
      objectShorthand: true,
    },
    inlineDynamicImports: true,
  },
  external: ['electron', 'ws'],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      presets: [pluginTypeScript],
    }),
    nodeResolve(),
    // @ts-ignore
    commonjs(),
  ],
}

export const bundleJs = async () => {
  const input = await rollup(options)
  // @ts-ignore
  await input.write(options.output)
}
