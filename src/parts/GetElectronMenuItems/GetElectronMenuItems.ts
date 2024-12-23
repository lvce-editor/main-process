export const getElectronMenuItems = (menuItems, click) => {
  const template = []
  for (const menuItem of menuItems) {
    // @ts-ignore
    template.push({
      ...menuItem,
      click,
    })
  }
  return template
}
