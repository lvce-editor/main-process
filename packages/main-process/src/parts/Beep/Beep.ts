import { shell } from 'electron'

export const beep = (): void => {
  shell.beep()
}
