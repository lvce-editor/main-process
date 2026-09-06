import { expect, jest, test } from '@jest/globals'
import { getElectronMenuItems } from '../src/parts/GetElectronMenuItems/GetElectronMenuItems.ts'

test('editing actions retain their originating web contents and stop after disposal', () => {
  const contents = { cut: jest.fn(), isDestroyed: jest.fn(() => false) }
  const click = jest.fn()
  const [item] = getElectronMenuItems([{ label: 'Cut', role: 'cut' }], click, contents as any)
  expect(item.role).toBeUndefined()
  item.click?.({ label: 'Cut' } as any, undefined, {})
  expect(contents.cut).toHaveBeenCalledTimes(1)
  contents.isDestroyed.mockReturnValue(true)
  item.click?.({ label: 'Cut' } as any, undefined, {})
  expect(contents.cut).toHaveBeenCalledTimes(1)
})

test('ordinary menu callbacks and disabled entries are preserved', () => {
  const click = jest.fn()
  const items = getElectronMenuItems([{ enabled: false, label: 'Reload' }], click)
  expect(items).toEqual([{ click, enabled: false, label: 'Reload' }])
})
