import { app, BrowserWindow, utilityProcess } from 'electron'
import * as Profile from '../../packages/main-process/src/parts/StartupCpuProfile/StartupCpuProfile.ts'

Profile.configure({
  'cpu-profile': true,
  ...(process.env.PROFILE_OUTPUT && { 'cpu-profile-dir': process.env.PROFILE_OUTPUT }),
  open: 'test.js',
})

app.whenReady().then(async () => {
  try {
    await Profile.start()
    await Profile.createUtility({ name: 'test-utility', path: process.env.PROFILE_UTILITY }, async (options) => {
      const child = utilityProcess.fork(options.path)
      return new Promise((resolve, reject) => {
        child.once('message', resolve)
        child.once('exit', (code) => reject(new Error(`Utility exited before readiness: ${code}`)))
      })
    })
    const window = new BrowserWindow({ show: false })
    await window.loadURL('data:text/html,CPU probe')
    await window.webContents.executeJavaScript(`new Promise(resolve => {
      const worker = new Worker(URL.createObjectURL(new Blob([
        'function workerBusy(){const end=performance.now()+200;while(performance.now()<end){Math.sqrt(Math.random())}};workerBusy();postMessage("done")'
      ])));
      worker.onmessage = () => resolve();
      window.worker = worker;
      function rendererBusy(){const end=performance.now()+200;while(performance.now()<end){Math.sqrt(Math.random())}}
      rendererBusy();
    })`)
    function mainBusy() {
      const end = performance.now() + 200
      while (performance.now() < end) Math.sqrt(Math.random())
    }
    mainBusy()
    await Profile.complete(process.env.PROFILE_FAILURE || '')
  } catch (error) {
    await Profile.complete(String(error))
  }
})
