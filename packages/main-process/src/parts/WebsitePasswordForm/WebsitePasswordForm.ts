// Runs only in an isolated world of the top-level page. No page message or IPC bridge is exposed.
const worldId = 1004

export const capture = async (webContents: Electron.WebContents, token: string, href: string, includePassword: boolean): Promise<any> => {
  return webContents.executeJavaScriptInIsolatedWorld(worldId, [
    {
      code: `(() => {
    delete globalThis.lvcePasswordTarget;
    if (location.href !== ${JSON.stringify(href)} || location.protocol !== 'https:') return null;
    const visible = element => !element.disabled && !element.readOnly && element.getClientRects().length && getComputedStyle(element).visibility === 'visible';
    const passwords = [...document.querySelectorAll('input[type="password"]')].filter(visible);
    const password = passwords.includes(document.activeElement) ? document.activeElement : passwords.length === 1 ? passwords[0] : null;
    if (!password || !password.form || new URL(password.form.action).origin !== location.origin) return null;
    const form = password.form;
    const usernames = [...form.elements].filter(element => element instanceof HTMLInputElement && ['text', 'email'].includes(element.type) && visible(element));
    const explicit = usernames.filter(element => element.autocomplete === 'username');
    const username = explicit.length === 1 ? explicit[0] : usernames.length === 1 ? usernames[0] : null;
    globalThis.lvcePasswordTarget = { token: ${JSON.stringify(token)}, href: location.href, password, username, form };
    if (!globalThis.lvcePasswordPagehideListener) {
      globalThis.lvcePasswordPagehideListener = true;
      addEventListener('pagehide', () => { delete globalThis.lvcePasswordTarget; });
    }
    return { username: username ? username.value.slice(0, 1025) : '', password: ${includePassword} ? password.value.slice(0, 16385) : '' };
  })()`,
    },
  ])
}

export const fill = async (webContents: Electron.WebContents, token: string, username: string, password: string): Promise<boolean> => {
  return webContents.executeJavaScriptInIsolatedWorld(worldId, [
    {
      code: `(() => {
    const target = globalThis.lvcePasswordTarget;
    delete globalThis.lvcePasswordTarget;
    if (!target || target.token !== ${JSON.stringify(token)} || target.href !== location.href || location.protocol !== 'https:') return false;
    const { form, password, username } = target;
    const usable = element => element.isConnected && element.form === form && !element.disabled && !element.readOnly && element.getClientRects().length && getComputedStyle(element).visibility === 'visible';
    if (!form.isConnected || new URL(form.action).origin !== location.origin || !usable(password) || password.type !== 'password' || password.autocomplete === 'new-password') return false;
    if (username && (!usable(username) || !['text', 'email'].includes(username.type))) return false;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    if (username) setValue.call(username, ${JSON.stringify(username)});
    setValue.call(password, ${JSON.stringify(password)});
    for (const element of [username, password]) {
      if (!element) continue;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  })()`,
    },
  ])
}

export const clear = async (webContents: Electron.WebContents, token: string): Promise<void> => {
  if (webContents.isDestroyed()) return
  try {
    await webContents.executeJavaScriptInIsolatedWorld(worldId, [
      { code: `if (globalThis.lvcePasswordTarget?.token === ${JSON.stringify(token)}) delete globalThis.lvcePasswordTarget;` },
    ])
  } catch {
    // Navigation may destroy the isolated world before cleanup executes.
  }
}
