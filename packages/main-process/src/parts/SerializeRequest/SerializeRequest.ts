/**
 *
 * @param {Headers} headers
 */
const serializeRequestHeaders = (headers) => {
  return Object.fromEntries(headers)
}

/**
 *
 * @param {Request} request
 */
export const serializeRequest = (request) => {
  return {
    headers: serializeRequestHeaders(request.headers),
    url: request.url,
  }
}
