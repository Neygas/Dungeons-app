import { useRef, useState } from 'react'
import type { Character } from '@/types'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { ACTIVE_CLASS_FEATURES, getFeaturesForCharacter, featMaxUses } from '@/data/classFeatures'

interface Props { character: Character }

const TYPE_LABEL: Record<string, string> = {
  toggle: 'Toggle',
  uses: 'Uses',
  pool: 'Pool',
  info: 'Passive',
}

const RESET_LABEL: Record<string, string> = {
  short: 'Short rest',
  long: 'Long rest',
  round: 'Each round',
  none: '',
}

export default function ClassFeaturesSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [resetConfirmKey, setResetConfirmKey] = useState<string | null>(null)
  const lpTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const features = getFeaturesForCharacter(c)
  const uses: Record<string, number> = c.feature_uses ?? {}
  const active: Record<string, boolean> = c.features_active ?? {}

  const patchUses = (newUses: Record<string, number>) =>
    patchActiveCharacter({ feature_uses: newUses })

  const patchActive = (newActive: Record<string, boolean>) =>
    patchActiveCharacter({ features_active: newActive })

  const spendUse = async (key: string) => {
    const feature = ACTIVE_CLASS_FEATURES.find(f => f.key === key)
    if (!feature) return
    const max = featMaxUses(feature, c)
    const current = uses[key] ?? 0
    if (current >= max) { showToast('No uses remaining'); return }
    await patchUses({ ...uses, [key]: current + 1 })
  }

  const restoreUse = async (key: string) => {
    const current = uses[key] ?? 0
    if (current <= 0) return
    await patchUses({ ...uses, [key]: current - 1 })
  }

  const resetUses = async (key: string) => {
    await patchUses({ ...uses, [key]: 0 })
    const feature = ACTIVE_CLASS_FEATURES.find(f => f.key === key)
    showToast(`${feature?.name ?? key} uses reset`)
    setResetConfirmKey(null)
  }

  const toggleFeature = async (key: string) => {
    const feature = ACTIVE_CLASS_FEATURES.find(f => f.key === key)
    if (!feature) return
    const isOn = active[key] ?? false
    if (!isOn && feature.maxUses !== null) {
      const max = featMaxUses(feature, c)
      const current = uses[key] ?? 0
      if (current >= max) { showToast('No uses remaining'); return }
      await Promise.all([
        patchActive({ ...active, [key]: true }),
        patchUses({ ...uses, [key]: current + 1 }),
      ])
    } else {
      await patchActive({ ...active, [key]: !isOn })
    }
    showToast(isOn ? `${feature.name} deactivated` : `${feature.name} activated`)
  }

  const shortRestRecover = async () => {
    const newUses = { ...uses }
    for (const f of features) {
      if (f.resetOn === 'short' || f.resetOn === 'long') {
        if (f.key === 'bardicInspiration' && c.level < 5) continue
        newUses[f.key] = 0
      }
    }
    await patchUses(newUses)
    showToast('Short rest — features recovered')
  }

  const longRestRecover = async () => {
    const newUses: Record<string, number> = {}
    for (const f of features) newUses[f.key] = 0
    await Promise.all([
      patchUses(newUses),
      patchActive({}),
    ])
    showToast('Long rest — all features recovered')
  }

  const startLongPress = (key: string) => {
    lpTimers.current[key] = setTimeout(() => setResetConfirmKey(key), 600)
  }
  const endLongPress = (key: string) => {
    clearTimeout(lpTimers.current[key])
  }

  if (features.length === 0) {
    return (
      <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--text3)' }}>
        No tracked features for {c.class} at level {c.level}.
      </div>
    )
  }

  return (
    <div>
      {features.map(f => {
        const max = f.maxUses !== null ? featMaxUses(f, c) : 0
        const spent = uses[f.key] ?? 0
        const remaining = Math.max(0, max - spent)
        const isActive = active[f.key] ?? false
        const isExpanded = expandedKey === f.key
        const usePips = f.type === 'uses' && max <= 6
        const effects = f.effects ? f.effects(c) : []

        return (
          <div
            key={f.key}
            onMouseDown={() => startLongPress(f.key)}
            onMouseUp={() => endLongPress(f.key)}
            onTouchStart={() => startLongPress(f.key)}
            onTouchEnd={() => endLongPress(f.key)}
            onContextMenu={e => { e.preventDefault(); setResetConfirmKey(f.key) }}
            style={{
              background: 'var(--white)',
              border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border)'}`,
              borderTop: 'none',
              transition: 'border-color .2s',
              userSelect: 'none',
            }}
          >
            {/* Header row */}
            <div
              onClick={() => setExpandedKey(isExpanded ? null : f.key)}
              style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', gap: 10 }}
            >
              {/* Active indicator dot */}
              {f.type === 'toggle' && (
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'var(--teal)' : 'var(--border2)',
                  border: `2px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                  transition: 'background .2s',
                }} />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? 'var(--teal2)' : 'var(--text)' }}>{f.name}</span>
                  {f.reaction && (
                    <span style={{ fontSize: 10, background: '#fde8e8', color: 'var(--red)', padding: '1px 5px', borderRadius: 3, fontWeight: 600, letterSpacing: .3 }}>REACTION</span>
                  )}
                  {f.sub && (
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{f.sub}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {TYPE_LABEL[f.type]}
                  {f.resetOn !== 'none' && ` · ${RESET_LABEL[f.resetOn]}`}
                  {f.type !== 'info' && f.type !== 'toggle' && max > 0 && ` · ${remaining}/${max} remaining`}
                </div>
              </div>

              {/* Pip display (read-only) + Use button */}
              {f.type === 'uses' && usePips && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: max }, (_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 13, height: 13, borderRadius: '50%',
                          background: i < remaining ? 'var(--teal)' : 'var(--border2)',
                          border: `2px solid ${i < remaining ? 'var(--teal)' : 'var(--border2)'}`,
                          transition: 'all .15s',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); spendUse(f.key) }}
                    disabled={remaining === 0}
                    style={{
                      padding: '4px 10px',
                      border: `1px solid ${remaining > 0 ? 'var(--teal)' : 'var(--border2)'}`,
                      background: remaining > 0 ? 'var(--teal-light)' : 'var(--bg)',
                      color: remaining > 0 ? 'var(--teal2)' : 'var(--text3)',
                      fontSize: 12, fontWeight: 600, cursor: remaining > 0 ? 'pointer' : 'not-allowed',
                      borderRadius: 3, fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >Use</button>
                </div>
              )}

              {/* Counter for large counts or pool */}
              {((f.type === 'uses' && !usePips) || f.type === 'pool') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); spendUse(f.key) }}
                    style={{ width: 26, height: 26, border: '1px solid var(--border2)', background: 'var(--white)', borderRadius: 2, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}
                  >−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: 'center', color: remaining === 0 ? 'var(--text3)' : 'var(--text)' }}>
                    {remaining}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); restoreUse(f.key) }}
                    style={{ width: 26, height: 26, border: '1px solid var(--border2)', background: 'var(--white)', borderRadius: 2, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}
                  >+</button>
                </div>
              )}

              {/* Toggle button */}
              {f.type === 'toggle' && (
                <button
                  onClick={e => { e.stopPropagation(); toggleFeature(f.key) }}
                  style={{
                    padding: '5px 12px', border: `1px solid ${isActive ? 'var(--teal)' : 'var(--border2)'}`,
                    background: isActive ? 'var(--teal)' : 'var(--white)',
                    color: isActive ? '#fff' : 'var(--text2)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 3,
                    fontFamily: 'inherit', flexShrink: 0, transition: 'all .2s',
                  }}
                >{isActive ? 'Active' : 'Activate'}</button>
              )}

              <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, marginLeft: 2 }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '10px 0 0' }}>{f.desc}</p>
                {effects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {effects.map(eff => (
                      <span key={eff} style={{ fontSize: 11, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '2px 7px', borderRadius: 3, fontWeight: 500 }}>{eff}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {f.type === 'uses' && !usePips && (
                    <button onClick={() => spendUse(f.key)} disabled={remaining === 0} style={{ flex: 1, padding: '7px 0', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 13, cursor: remaining === 0 ? 'not-allowed' : 'pointer', borderRadius: 2, fontFamily: 'inherit', color: remaining === 0 ? 'var(--text3)' : 'var(--text)' }}>Use</button>
                  )}
                  {f.type !== 'info' && f.type !== 'toggle' && (
                    <button onClick={() => resetUses(f.key)} style={{ flex: 1, padding: '7px 0', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 13, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--teal2)', fontWeight: 500 }}>Reset uses</button>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, opacity: .7 }}>Hold anywhere on this card to reset uses</div>
              </div>
            )}
          </div>
        )
      })}

      {/* Rest recovery buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 0 0' }}>
        <button
          onClick={shortRestRecover}
          style={{ flex: 1, padding: '9px 0', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}
        >
          Short Rest Recovery
        </button>
        <button
          onClick={longRestRecover}
          style={{ flex: 1, padding: '9px 0', border: '1px solid var(--teal)', background: 'var(--teal-light)', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--teal2)' }}
        >
          Long Rest Recovery
        </button>
      </div>

      {/* Reset confirmation modal */}
      {resetConfirmKey && (() => {
        const feature = features.find(f => f.key === resetConfirmKey)
        if (!feature) return null
        const max = feature.maxUses !== null ? featMaxUses(feature, c) : 0
        const spent = uses[resetConfirmKey] ?? 0
        const remaining = Math.max(0, max - spent)
        return (
          <div
            onClick={() => setResetConfirmKey(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--white)', borderRadius: 10, width: '100%', maxWidth: 320, padding: 22 }}
            >
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Reset {feature.name}?</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 6, lineHeight: 1.5 }}>
                Restore all uses back to full.
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '10px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text3)' }}>{remaining}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>current</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal2)' }}>{max}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>after reset</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => resetUses(resetConfirmKey)}
                  style={{ flex: 1, padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setResetConfirmKey(null)}
                  style={{ flex: 1, padding: 12, background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 14, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
