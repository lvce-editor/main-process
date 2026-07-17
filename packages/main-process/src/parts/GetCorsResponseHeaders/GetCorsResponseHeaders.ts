const accessControlAllowOrigin = 'access-control-allow-origin'

export const getCorsResponseHeaders = (responseHeaders: Record<string, string[]> = {}): Record<string, string[]> => {
  const hasAccessControlAllowOrigin = Object.keys(responseHeaders).some((key) => key.toLowerCase() === accessControlAllowOrigin)
  if (hasAccessControlAllowOrigin) {
    return responseHeaders
  }
  return {
    ...responseHeaders,
    'Access-Control-Allow-Origin': ['*'],
  }
}
