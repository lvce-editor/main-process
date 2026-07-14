export const isPromptMode = (parsedArgs: Readonly<Record<string, unknown>>): boolean => {
  return typeof parsedArgs.prompt === 'string'
}
