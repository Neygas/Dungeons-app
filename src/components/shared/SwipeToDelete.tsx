import { useState, useRef } from 'react'

interface Props {
  onDelete: () => void
  children: React.ReactNode
  deleteLabel?: string
}

const REVEAL = 72
const THRESHOLD = 36

export default function SwipeToDelete({ onDelete, children, deleteLabel = 'Delete' }: Props) {
  const [offset, setOffsetState] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offsetRef = useRef(0)
  const startX = useRef(0)
  const startOff = useRef(0)
  const startTime = useRef(0)
  const moved = useRef(false)

  const setOffset = (v: number) => {
    offsetRef.current = v
    setOffsetState(v)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startOff.current = offsetRef.current
    startTime.current = Date.now()
    moved.current = false
    setDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    if (Math.abs(dx) > 5) moved.current = true
    setOffset(Math.max(-REVEAL, Math.min(0, startOff.current + dx)))
  }

  const handleTouchEnd = () => {
    setDragging(false)
    const velocity = Math.abs(offsetRef.current) / Math.max(1, Date.now() - startTime.current)
    setOffset(velocity > 0.3 || offsetRef.current < -THRESHOLD ? -REVEAL : 0)
  }

  return (
    <div style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          width: `calc(100% + ${REVEAL}px)`,
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 220ms var(--ease-drawer)',
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{ flex: 1, minWidth: 0 }}
          onClick={e => { if (moved.current) { e.stopPropagation(); e.preventDefault() } }}
        >
          {children}
        </div>
        <button
          onClick={() => { setOffset(0); onDelete() }}
          style={{
            width: REVEAL,
            flexShrink: 0,
            background: 'var(--red)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {deleteLabel}
        </button>
      </div>
    </div>
  )
}
