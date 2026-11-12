import type { editor } from 'monaco-editor'

const WHEEL_LINE_PIXELS = 16

type HorizontalScrollEditor = Pick<
  editor.ICodeEditor,
  'getContainerDomNode' | 'getScrollLeft' | 'setScrollLeft' | 'getScrollWidth'
> & { getLayoutInfo: () => Pick<editor.EditorLayoutInfo, 'contentWidth'> }

type DiffEditorWithPanes = {
  getModifiedEditor: () => HorizontalScrollEditor
  getOriginalEditor: () => HorizontalScrollEditor
}

function toWheelPixels(delta: number, deltaMode: number, pageWidth: number): number {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return delta * WHEEL_LINE_PIXELS
  }
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return delta * pageWidth
  }
  return delta
}

function isHorizontalDominant(event: WheelEvent): boolean {
  return Math.abs(event.deltaX) > Math.abs(event.deltaY)
}

function getHorizontalWheelPixels(event: WheelEvent, pageWidth: number): number {
  const delta = event.shiftKey && !isHorizontalDominant(event) ? event.deltaY : event.deltaX
  return toWheelPixels(delta, event.deltaMode, pageWidth)
}

function getMaxScrollLeft(editor: HorizontalScrollEditor): number {
  return Math.max(0, editor.getScrollWidth() - editor.getLayoutInfo().contentWidth)
}

function installPaneHorizontalWheelScroll(editor: HorizontalScrollEditor): () => void {
  const container = editor.getContainerDomNode()
  const handleWheel = (event: WheelEvent): void => {
    // Wrapped panes have no horizontal overflow; yield their gesture to the outer list.
    const maxScrollLeft = getMaxScrollLeft(editor)
    if (event.defaultPrevented || maxScrollLeft === 0) {
      return
    }

    const scrollLeft = editor.getScrollLeft()
    const nextScrollLeft = Math.min(
      maxScrollLeft,
      Math.max(0, scrollLeft + getHorizontalWheelPixels(event, container.clientWidth))
    )
    // A pane at its edge cannot move; the outer list keeps the gesture.
    if (nextScrollLeft === scrollLeft) {
      return
    }

    // Combined diffs disable Monaco wheel handling so vertical input reaches the outer list.
    if (event.shiftKey || isHorizontalDominant(event)) {
      event.preventDefault()
      event.stopPropagation()
    }
    editor.setScrollLeft(nextScrollLeft)
  }

  container.addEventListener('wheel', handleWheel, { capture: true, passive: false })
  return () => container.removeEventListener('wheel', handleWheel, true)
}

export function installDiffEditorHorizontalWheelScroll(editor: DiffEditorWithPanes): () => void {
  const cleanupOriginal = installPaneHorizontalWheelScroll(editor.getOriginalEditor())
  const cleanupModified = installPaneHorizontalWheelScroll(editor.getModifiedEditor())
  return () => {
    cleanupOriginal()
    cleanupModified()
  }
}
