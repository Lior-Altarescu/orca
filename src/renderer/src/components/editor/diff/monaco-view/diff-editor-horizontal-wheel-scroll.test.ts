// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { installDiffEditorHorizontalWheelScroll } from './diff-editor-horizontal-wheel-scroll'

function createPane(initialScrollLeft: number) {
  const container = document.createElement('div')
  let scrollLeft = initialScrollLeft
  Object.defineProperty(container, 'clientWidth', { value: 200 })
  document.body.appendChild(container)
  return {
    container,
    setScrollLeft: vi.fn((value: number) => {
      scrollLeft = value
    }),
    getScrollLeft: () => scrollLeft,
    getContainerDomNode: () => container,
    getScrollWidth: () => 1000,
    getLayoutInfo: () => ({ contentWidth: 200 })
  }
}

function dispatchWheel(target: HTMLElement, init: WheelEventInit): WheelEvent {
  const event = new WheelEvent('wheel', { ...init, bubbles: true, cancelable: true })
  // Happy DOM's WheelEvent omits mouse modifier fields.
  Object.defineProperty(event, 'shiftKey', { value: init.shiftKey ?? false })
  target.dispatchEvent(event)
  return event
}

function installPanes(originalScrollLeft: number) {
  const original = createPane(originalScrollLeft)
  const modified = createPane(10)
  installDiffEditorHorizontalWheelScroll({
    getOriginalEditor: () => original,
    getModifiedEditor: () => modified
  })
  return { original, modified }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('installDiffEditorHorizontalWheelScroll', () => {
  it('scrolls only the pane under the pointer on a sideways swipe without Shift', () => {
    const { original, modified } = installPanes(10)

    const event = dispatchWheel(original.container, { deltaX: 30, deltaY: 4 })

    expect(original.setScrollLeft).toHaveBeenCalledWith(40)
    expect(modified.setScrollLeft).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('leaves a mostly vertical swipe to the outer list while applying its sideways part', () => {
    const { original } = installPanes(10)

    const event = dispatchWheel(original.container, { deltaX: 5, deltaY: 40 })

    expect(original.setScrollLeft).toHaveBeenCalledWith(15)
    expect(event.defaultPrevented).toBe(false)
  })

  it('hands the gesture to the outer list when the pane is already at its edge', () => {
    const { original } = installPanes(800)

    const event = dispatchWheel(original.container, { deltaY: 30, shiftKey: true })

    expect(original.setScrollLeft).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })
})
