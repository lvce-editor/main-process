import { app } from 'electron'

export const exit = (code?: number) => {
  if (code === undefined) {
    app.quit()
    return
  }
  app.exit(code)
}
