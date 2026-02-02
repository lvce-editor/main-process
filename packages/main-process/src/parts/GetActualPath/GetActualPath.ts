export const getActualPath = (relative: string) => {
  const actual = relative === '/' ? '/index.html' : relative
  return actual
}
