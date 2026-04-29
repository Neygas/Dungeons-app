import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  direction?: 'up' | 'left' | 'right'
}

export default function PageTransition({ children, direction = 'up' }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const getTransform = () => {
    if (visible) return 'none'
    if (direction === 'right') return 'translateX(24px)'
    if (direction === 'left') return 'translateX(-24px)'
    return 'translateY(8px)'
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: getTransform(),
      transition: visible ? 'opacity 220ms var(--ease-out), transform 220ms var(--ease-out)' : 'none',
    }}>
      {children}
    </div>
  )
}
