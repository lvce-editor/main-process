import * as JsonRpc from '../JsonRpc/JsonRpc.ts'

export const create = (ipc) => {
  const handleRequest = async (request) => {
    const { method, url } = request
    console.log('got request', method, url)
    const { body, init } = await JsonRpc.invoke(ipc, 'WebViewProtocol.getResponse', method, url)
    return new Response(body, init)
  }
  return handleRequest
}
