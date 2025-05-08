import type { Rpc } from '@lvce-editor/rpc'

export const create = (rpc: Rpc) => {
  const handleRequest = async (request) => {
    const { method, url } = request
    const { body, init } = await rpc.invoke('WebViewProtocol.getResponse', method, url)
    return new Response(body, init)
  }
  return handleRequest
}
