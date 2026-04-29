import * as GetGeneratedPackageJson from '../src/parts/GetGeneratedPackageJson/GetGeneratedPackageJson.ts'

test('getGeneratedPackageJson', () => {
  expect(GetGeneratedPackageJson.getGeneratedPackageJson('41.3.0', '0.80.10')).toEqual({
    name: 'lvce-local-dev-runtime',
    private: true,
    type: 'module',
    main: 'dist/mainProcessMain.js',
    dependencies: {
      electron: '41.3.0',
      '@lvce-editor/shared-process': '0.80.10',
      '@lvce-editor/static-server': '0.80.10',
    },
  })
})
