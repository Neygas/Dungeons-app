import { useState } from 'react'

interface RollResult {
  notation: string
  rolls: number[]
  modifier: number
  total: number
  isCrit: boolean
  isFail: boolean
}

interface Props {
  onClose: () => void
}

const DICE = [4, 6, 8, 10, 12, 20] as const

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1
}

export default function DiceRoller({ onClose }: Props) {
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [history, setHistory] = useState<RollResult[]>([])

  const roll = (sides: number) => {
    const rolls = Array.from({ length: count }, () => rollDie(sides))
    const sum = rolls.reduce((a, b) => a + b, 0)
    const total = sum + modifier
    const isCrit = sides === 20 && count === 1 && rolls[0] === 20
    const isFail = sides === 20 && count === 1 && rolls[0] === 1
    const modStr = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''
    const notation = `${count}d${sides}${modStr}`
    const result: RollResult = { notation, rolls, modifier, total, isCrit, isFail }
    setHistory(prev => [result, ...prev].slice(0, 8))
  }

  const totalColor = (r: RollResult) => {
    if (r.isCrit) return 'var(--teal2)'
    if (r.isFail) return 'var(--red)'
    return 'var(--text)'
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div style={{ background: 'var(--white)', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: 480, padding: '16px 16px 32px', boxShadow: '0 -4px 24px rgba(0,0,0,.15)' }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Dice Roller</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text3)', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>

        {/* Count + modifier row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4 }}>Count</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    flex: 1, padding: '6px 0', border: `1px solid ${count === n ? 'var(--teal)' : 'var(--border2)'}`,
                    background: count === n ? 'var(--teal-light)' : 'var(--white)',
                    color: count === n ? 'var(--teal2)' : 'var(--text2)',
                    fontSize: 13, fontWeight: 600, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4 }}>Modifier</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setModifier(m => m - 1)} style={{ width: 28, height: 28, border: '1px solid var(--border2)', background: 'var(--white)', borderRadius: 3, fontSize: 16, cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit' }}>−</button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: modifier === 0 ? 'var(--text3)' : modifier > 0 ? 'var(--teal2)' : 'var(--red)' }}>
                {modifier > 0 ? `+${modifier}` : modifier}
              </span>
              <button onClick={() => setModifier(m => m + 1)} style={{ width: 28, height: 28, border: '1px solid var(--border2)', background: 'var(--white)', borderRadius: 3, fontSize: 16, cursor: 'pointer', color: 'var(--text2)', fontFamily: 'inherit' }}>+</button>
            </div>
          </div>
        </div>

        {/* Dice buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 16 }}>
          {DICE.map(sides => (
            <button
              key={sides}
              onClick={() => roll(sides)}
              style={{
                padding: '10px 0', border: '1px solid var(--border2)', background: sides === 20 ? 'var(--teal)' : 'var(--white)',
                color: sides === 20 ? '#fff' : 'var(--text)',
                fontSize: 12, fontWeight: 700, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'all .12s',
              }}
            >
              d{sides}
            </button>
          ))}
        </div>

        {/* Roll history */}
        {history.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 8 }}>Results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: i === 0 ? 'var(--teal-light)' : 'var(--bg)', borderRadius: 4, border: `1px solid ${i === 0 ? 'var(--teal)' : 'var(--border)'}` }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', minWidth: 54, fontWeight: 500 }}>{r.notation}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', flex: 1 }}>
                    [{r.rolls.join(', ')}]{r.modifier !== 0 ? ` ${r.modifier > 0 ? '+' : ''}${r.modifier}` : ''}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: totalColor(r), minWidth: 28, textAlign: 'right' }}>
                    {r.total}
                  </span>
                  {r.isCrit && <span style={{ fontSize: 10, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>CRIT</span>}
                  {r.isFail && <span style={{ fontSize: 10, background: '#fde8e8', color: 'var(--red)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>FAIL</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
