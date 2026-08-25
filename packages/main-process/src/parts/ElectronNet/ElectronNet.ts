import { net } from 'electron'
import * as Assert from '../Assert/Assert.ts'

export const getJson = async (url: string): Promise<any> => {
  Assert.string(url)
  const response = await net.fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
