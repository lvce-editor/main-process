import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as Path from '../Path/Path.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const root = process.env.LVCE_ROOT || Path.join(__dirname, '../../../../..')
