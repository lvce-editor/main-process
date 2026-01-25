/* eslint-disable n/no-unsupported-features/node-builtins */
import { openAsBlob } from 'node:fs'

export const getFileResponse = async (absolutePath: string, headers: any): Promise<Response> => {
  // TODO support request method head
  const blob = await openAsBlob(absolutePath)
  const response = new Response(blob, {
    headers,
    status: 200,
  })
  return response
}
