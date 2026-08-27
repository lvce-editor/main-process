import { clipboard } from 'electron'

export const writeText = async (text) => {
  await clipboard.writeText(text)
}
