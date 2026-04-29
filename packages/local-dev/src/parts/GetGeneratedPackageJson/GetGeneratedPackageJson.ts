export interface GeneratedPackageJson {
  readonly name: string
  readonly private: true
  readonly type: 'module'
  readonly main: string
  readonly dependencies: {
    readonly electron: string
    readonly '@lvce-editor/shared-process': string
    readonly '@lvce-editor/static-server': string
  }
}

export const getGeneratedPackageJson = (electronVersion: string, lvceVersion: string): GeneratedPackageJson => {
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