const serializeRequestHeaders = (headers: Headers): Record<string, string> => {
  return Object.fromEntries(headers)
}

export interface SerializedRequest {
  headers: Record<string, string>
  url: string
}

export const serializeRequest = (request: Request): SerializedRequest => {
  return {
    headers: serializeRequestHeaders(request.headers),
    url: request.url,
  }
}
