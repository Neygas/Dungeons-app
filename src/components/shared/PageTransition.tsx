import { motion } from 'framer-motion'

interface Props {
  children: React.ReactNode
  direction?: 'up' | 'left' | 'right'
}

const variants = {
  up: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  },
  right: {
    initial: { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  left: {
    initial: { opacity: 0, x: -28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
}

const transition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
}

export default function PageTransition({ children, direction = 'up' }: Props) {
  const v = variants[direction]
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={transition}
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}
