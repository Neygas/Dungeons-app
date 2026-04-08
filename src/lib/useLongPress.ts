import { useCallback, useRef } from 'react'

export function useLongPress(callback: () => void, ms = 600) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault()
    triggered.current = false
    timerRef.current = setTimeout(() => {
      triggered.current = true
      callback()
    }, ms)
  }, [callback, ms])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Block the click that fires after a long press
  const preventClick = useCallback((e: React.MouseEvent) => {
    if (triggered.current) {
      e.stopPropagation()
      e.preventDefault()
      triggered.current = false
    }
  }, [])

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onClick: preventClick,
  }
}
