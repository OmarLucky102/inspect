import { useEffect, useRef, type RefObject } from 'react'

/**
 * Closes an open floating menu when clicking outside any tracked element
 * or pressing the Escape key.
 */
export function useDropdownDismiss(
  isOpen: boolean,
  onClose: () => void,
  refs: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
): void {
  const onCloseRef = useRef(onClose)
  const refsRef = useRef<Array<RefObject<HTMLElement | null>>>([])

  useEffect(() => {
    onCloseRef.current = onClose
    refsRef.current = Array.isArray(refs) ? refs : [refs]
  })

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (event: MouseEvent) => {
      const node = event.target as Node | null
      if (!node) return
      const clickedInside = refsRef.current.some((ref) =>
        ref.current?.contains(node),
      )
      if (!clickedInside) {
        onCloseRef.current()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])
}
