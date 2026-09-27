const { ipcRenderer } = require('electron')

// Keep the decision in the event's frame, without a cached focus signal in main.
window.addEventListener(
  'keydown',
  (event) => {
    if (!event.isTrusted || event.isComposing || event.key !== '.' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return
    }
    const path = event.composedPath()
    if (document.designMode === 'on' || path.some((node) => node instanceof Element && (node.matches('input, textarea') || node.isContentEditable))) {
      return
    }
    // A closed shadow root hides its editing target. Leave its keys with the page.
    if (path.some((node) => node instanceof Element && node.localName.includes('-'))) {
      return
    }
    if (ipcRenderer.sendSync('browser-period-keybinding')) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  },
  true,
)
