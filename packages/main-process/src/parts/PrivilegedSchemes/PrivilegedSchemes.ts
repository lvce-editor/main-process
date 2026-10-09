import * as Platform from '../Platform/Platform.ts'
import * as Scheme from '../Scheme/Scheme.ts'

export const privilegedSchemes = [
  {
    privileges: {
      corsEnabled: true,
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
    scheme: Platform.fontScheme,
  },
  {
    privileges: {
      codeCache: true,
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
    },
    scheme: Platform.scheme,
  },
  {
    privileges: {
      codeCache: true,
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
    },
    scheme: Scheme.WebView,
  },
]
