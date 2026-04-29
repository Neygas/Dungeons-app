import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore, type CutsceneType } from '@/store/uiStore'

const SCENES: Record<CutsceneType, {
  bg: string
  icon: string
  title: string
  subtitle: string
  duration: number
}> = {
  'combat-start': {
    bg: 'radial-gradient(ellipse at center, rgba(180,20,20,0.97) 0%, rgba(80,5,5,0.99) 100%)',
    icon: '⚔️',
    title: 'BATTLE BEGINS',
    subtitle: 'Roll for initiative!',
    duration: 2200,
  },
  'short-rest': {
    bg: 'radial-gradient(ellipse at center, rgba(170,90,15,0.95) 0%, rgba(90,40,5,0.98) 100%)',
    icon: '🔥',
    title: 'Short Rest',
    subtitle: 'Spending hit dice...',
    duration: 2000,
  },
  'long-rest': {
    bg: 'radial-gradient(ellipse at center, rgba(20,25,80,0.97) 0%, rgba(5,8,35,0.99) 100%)',
    icon: '🌙',
    title: 'Long Rest',
    subtitle: 'Fully restored',
    duration: 2500,
  },
  'level-up': {
    bg: 'radial-gradient(ellipse at center, rgba(120,85,5,0.97) 0%, rgba(60,35,0,0.99) 100%)',
    icon: '⭐',
    title: 'LEVEL UP',
    subtitle: '',
    duration: 3000,
  },
}

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

export default function CutsceneOverlay() {
  const { cutscene, dismissCutscene } = useUIStore()

  useEffect(() => {
    if (!cutscene) return
    const id = setTimeout(dismissCutscene, SCENES[cutscene.type].duration)
    return () => clearTimeout(id)
  }, [cutscene?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const scene = cutscene ? SCENES[cutscene.type] : null
  const subtitle = cutscene?.type === 'level-up' && cutscene.data?.level
    ? `Welcome to Level ${cutscene.data.level}!`
    : (scene?.subtitle ?? '')

  return (
    <AnimatePresence>
      {cutscene && scene && (
        <motion.div
          key={cutscene.key}
          onClick={dismissCutscene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: scene.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.65, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            style={{ textAlign: 'center', padding: '0 32px' }}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.15, 1] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1], ease }}
              style={{ fontSize: 80, marginBottom: 20, lineHeight: 1, userSelect: 'none' }}
            >
              {scene.icon}
            </motion.div>
            <div style={{
              fontSize: 34, fontWeight: 900, color: '#fff',
              letterSpacing: 3, textTransform: 'uppercase',
              textShadow: '0 2px 24px rgba(0,0,0,.5)',
            }}>
              {scene.title}
            </div>
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                style={{ fontSize: 17, color: 'rgba(255,255,255,.72)', marginTop: 10, fontWeight: 500 }}
              >
                {subtitle}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{ position: 'absolute', bottom: 40, fontSize: 12, color: 'rgba(255,255,255,.4)', letterSpacing: 1 }}
          >
            tap to continue
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
