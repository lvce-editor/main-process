const replaceOrThrow = (content, occurrence, replacement, description) => {
  if (content.includes(replacement)) {
    return content
  }
  if (!content.includes(occurrence)) {
    throw new Error(`Failed to patch ${description}`)
  }
  return content.replace(occurrence, replacement)
}

export const patchMainProcessBundleContent = (content) => {
  let next = content
  next = replaceOrThrow(next, `const isLinux = platform === 'linux';`, `const isLinux = ${process.platform === 'linux'};`, 'main process linux flag')
  next = replaceOrThrow(next, `const isProduction = false;`, `const isProduction = true;`, 'main process production flag')
  next = replaceOrThrow(next, `const useIpcForResponse = true;`, `const useIpcForResponse = false;`, 'main process ipc response flag')
  return next
}

export const patchRendererProcessBundleContent = (content) => {
  return replaceOrThrow(content, 'const platform = Remote;', 'const platform = Electron;', 'renderer process platform')
}

export const patchRendererWorkerBundleContent = (content) => {
  return replaceOrThrow(content, 'const platform = Remote;', 'const platform = Electron$1;', 'renderer worker platform')
}

export const patchExtensionHostWorkerBundleContent = (content) => {
  return replaceOrThrow(
    content,
    'const platform = Remote; // TODO tree-shake this out in production',
    'const platform = Electron; // TODO tree-shake this out in production',
    'extension host worker platform',
  )
}

export const patchSharedProcessIsElectronContent = (content) => {
  return replaceOrThrow(content, 'export const isElectron = false;', 'export const isElectron = true;', 'shared process electron flag')
}
