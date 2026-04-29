export const getGeneratedPackageJson = (electronVersion, lvceVersion) => {
  return {
    name: 'lvce-local-dev-runtime',
    private: true,
    type: 'module',
    main: 'dist/mainProcessMain.js',
    dependencies: {
      electron: electronVersion,
      '@lvce-editor/shared-process': lvceVersion,
      '@lvce-editor/static-server': lvceVersion,
    },
  }
}
