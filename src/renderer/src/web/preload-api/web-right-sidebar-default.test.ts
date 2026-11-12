// @vitest-environment happy-dom
import { beforeEach, expect, it } from 'vitest'
import { readLocalWebUIState } from './web-preferences-store'
import { SETTINGS_STORAGE_KEY, UI_STORAGE_KEY } from './web-storage'

beforeEach(() => {
  localStorage.clear()
})

it('opens the right sidebar for a new web profile', () => {
  expect(readLocalWebUIState().rightSidebarOpen).toBe(true)
})

it('keeps a saved closed right sidebar', () => {
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({ rightSidebarOpen: false }))
  expect(readLocalWebUIState().rightSidebarOpen).toBe(false)
})

it('keeps an older saved preference to start with it closed', () => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ rightSidebarOpenByDefault: false }))
  expect(readLocalWebUIState().rightSidebarOpen).toBe(false)
})
