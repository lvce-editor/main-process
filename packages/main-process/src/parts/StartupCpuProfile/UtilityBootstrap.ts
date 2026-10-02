// Runs before the utility entry point. Electron utility processes ignore Node's --cpu-prof/--require flags.
export const getBootstrap = (entryPoint: string, endpointPath: string): string => `
const inspector = require('node:inspector');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
inspector.open(0, '127.0.0.1');
fs.writeFileSync(${JSON.stringify(endpointPath)}, inspector.url(), { flag: 'wx', mode: 0o600 });
inspector.waitForDebugger();
process.argv[1] = ${JSON.stringify(entryPoint)};
import(pathToFileURL(${JSON.stringify(entryPoint)}).href).catch(error => { console.error(error); process.exit(1); });
`
