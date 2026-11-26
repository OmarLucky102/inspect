import { useEffect, useState } from 'react'

/**
 * Keeps a conditionally rendered overlay (dropdown, popover, menu) mounted
 * briefly during close so CSS exit animations can finish smoothly.
 */
export function useAnimatedMount(isOpen: boolean, exitMs = 150) {
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [exiting, setExiting] = useState(false)

  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen)
    setExiting(!isOpen)
  }

  useEffect(() => {
    if (!exiting) return
    const timer = window.setTimeout(() => setExiting(false), exitMs)
    return () => window.clearTimeout(timer)
  }, [exiting, exitMs])

  return {
    mounted: isOpen || exiting,
    state: (isOpen ? 'open' : 'closed') as 'open' | 'closed',
  }
}
