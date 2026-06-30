export const getGeneratedPackageJson = (electronVersion, lvceVersion) => {
  return {
    dependencies: {
      '@lvce-editor/shared-process': lvceVersion,
      '@lvce-editor/static-server': lvceVersion,
      electron: electronVersion,
    },
    main: 'dist/mainProcessMain.js',
    name: 'lvce-local-dev-runtime',
    private: true,
    type: 'module',
  }
}
