import { readFileSync } from 'node:fs'

export const getFileResponse = async (absolutePath: string, headers: any): Promise<Response> => {
  // TODO support request method head
  // TODO maybe use readAsBlob
  const content = readFileSync(absolutePath, 'utf8')
  const response = new Response(content, {
    headers,
    status: 200,
  })
  return response
}
