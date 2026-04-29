import * as ParseCliArgs from './parts/ParseCliArgs/ParseCliArgs.ts'
import * as PrepareSandbox from './parts/PrepareSandbox/PrepareSandbox.ts'
import * as RunLocalApp from './parts/RunLocalApp/RunLocalApp.ts'

const main = async (): Promise<void> => {
  const parsed = ParseCliArgs.parseCliArgs(process.argv.slice(2))
  switch (parsed.command) {
    case 'prepare': {
      await PrepareSandbox.prepareSandbox(parsed)
      return
    }
    case 'run': {
      const sandbox = await PrepareSandbox.prepareSandbox(parsed)
      await RunLocalApp.runLocalApp(parsed, sandbox)
      return
    }
    default:
      throw new Error(`Unsupported command ${parsed.command}`)
  }
}

await main()