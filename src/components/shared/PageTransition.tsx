interface Props {
  children: React.ReactNode
  direction?: 'up' | 'left' | 'right'
}

export default function PageTransition({ children, direction = 'up' }: Props) {
  const cls = direction === 'right' ? 'page-enter-right' : direction === 'left' ? 'page-enter-left' : 'page-enter'
  return <div className={cls}>{children}</div>
}
