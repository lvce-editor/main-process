import * as GetElectronPath from '../src/parts/GetElectronPath/GetElectronPath.js'

test('getElectronPath - linux', () => {
  expect(GetElectronPath.getElectronPath('/sandbox/node_modules/electron', 'linux')).toBe('/sandbox/node_modules/electron/dist/electron')
})

test('getElectronPath - windows', () => {
  expect(GetElectronPath.getElectronPath('C:/sandbox/node_modules/electron', 'win32')).toBe('C:/sandbox/node_modules/electron/dist/electron.exe')
})

test('getElectronPath - darwin', () => {
  expect(GetElectronPath.getElectronPath('/sandbox/node_modules/electron', 'darwin')).toBe(
    '/sandbox/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
  )
})

test('getElectronPath - unsupported platform', () => {
  expect(() => GetElectronPath.getElectronPath('/sandbox/node_modules/electron', 'freebsd')).toThrow(new Error('Unsupported platform freebsd'))
})
