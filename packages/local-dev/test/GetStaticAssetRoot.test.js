import * as GetStaticAssetRoot from '../src/parts/GetStaticAssetRoot/GetStaticAssetRoot.js'

test('getStaticAssetRoot', () => {
  expect(
    GetStaticAssetRoot.getStaticAssetRoot('/sandbox/node_modules/@lvce-editor/static-server/static', ['27c0844', 'index.html', 'favicon.ico']),
  ).toBe('/sandbox/node_modules/@lvce-editor/static-server/static/27c0844')
})

test('getStaticAssetRoot - no asset directory', () => {
  expect(() => GetStaticAssetRoot.getStaticAssetRoot('/sandbox/node_modules/@lvce-editor/static-server/static', ['index.html'])).toThrow(
    new Error('Could not find static asset directory'),
  )
})
