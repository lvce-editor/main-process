import * as Platform from '../Platform/Platform.ts'
import * as Scheme from '../Scheme/Scheme.js'

export const privilegedSchems = [
  {
    scheme: Platform.scheme,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
    },
  },
  {
    scheme: Scheme.WebView,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
    },
  },
]
