import { useState } from 'react'
import type { Character } from '@/types'
import { RACES, CLASSES, BACKGROUNDS, LEVEL_UP_FEATURES, XP_TABLE, CLASS_HD, SPELL_SLOTS_TABLE } from '@/data'
import { mod, profBonus, averageHpGain, rollDie } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props {
  character: Character
  initialTab?: 'about' | 'exp' | 'quick'
}

// ── Quick Access data ──────────────────────────────────────────────────────────
const COMBAT_ACTIONS = [
  { name: 'Attack', desc: 'Make one melee or ranged weapon attack.' },
  { name: 'Cast a Spell', desc: 'Cast a spell with a casting time of 1 action.' },
  { name: 'Dash', desc: 'Gain extra movement equal to your speed for this turn.' },
  { name: 'Disengage', desc: 'Your movement doesn\'t provoke opportunity attacks for the rest of the turn.' },
  { name: 'Dodge', desc: 'Attacks against you have disadvantage and you have advantage on DEX saves until your next turn.' },
  { name: 'Help', desc: 'Give an ally advantage on their next ability check, or on their next attack against a creature within 5 ft of you.' },
  { name: 'Hide', desc: 'Make a Stealth check. Must be obscured from the target.' },
  { name: 'Ready', desc: 'Choose a trigger and an action. You use your reaction to take that action when the trigger occurs.' },
  { name: 'Search', desc: 'Devote your attention to finding something (Perception or Investigation).' },
  { name: 'Use an Object', desc: 'Interact with a second object when your free interaction isn\'t enough.' },
  { name: 'Bonus Action', desc: 'Certain spells and class features use a bonus action instead of a full action.' },
  { name: 'Reaction', desc: 'Instant response to a trigger (opportunity attack, readied action, certain spells). 1 per round.' },
  { name: 'Free Interaction', desc: 'Draw or sheathe a weapon, open a door, etc. One free per turn.' },
  { name: 'Opportunity Attack', desc: 'When a creature leaves your reach, use your reaction to make one melee attack against it.' },
]

const RULES_REFERENCE = [
  { name: 'Advantage / Disadvantage', desc: 'Advantage: roll 2d20, take higher. Disadvantage: roll 2d20, take lower. They cancel each other out regardless of how many sources.' },
  { name: 'Cover', desc: 'Half cover: +2 AC and DEX saves. Three-quarters cover: +5. Full cover: cannot be targeted.' },
  { name: 'Concentration', desc: 'Some spells require concentration. Taking damage: CON save DC 10 or half damage taken (whichever is higher). Failure ends concentration.' },
  { name: 'Flanking (optional)', desc: 'When two creatures are on opposite sides of an enemy, they have advantage on melee attacks against it.' },
  { name: 'Surprise', desc: 'Surprised creatures skip their turn in the first round of combat and cannot take reactions until after their first turn.' },
  { name: 'Grapple', desc: 'Attack action: contested STR (Athletics) vs STR (Athletics) or DEX (Acrobatics). Success: target is grappled (speed 0). You can drag them at half speed.' },
  { name: 'Shove', desc: 'Attack action: contested STR (Athletics) vs STR (Athletics) or DEX (Acrobatics). Push 5 ft away or knock prone.' },
  { name: 'Two-Weapon Fighting', desc: 'When you take the Attack action with a light weapon, you can use a bonus action to attack with a second light weapon (no ability modifier to damage unless negative).' },
  { name: 'Critical Hit', desc: 'On a natural 20, double all damage dice (but not static modifiers). Some features expand the crit range.' },
  { name: 'Dying & Death Saves', desc: '3 successes = stable. 3 failures = dead. Natural 20 = regain 1 HP. Natural 1 = two failures. Taking damage while dying adds a failure.' },
  { name: 'Short Rest', desc: 'At least 1 hour of light activity. Spend Hit Dice to heal (d[hit die] + CON mod per die). Certain class features recharge.' },
  { name: 'Long Rest', desc: 'At least 8 hours of inactivity/sleep. Regain all HP, half maximum Hit Dice, all spell slots, and most class features.' },
  { name: 'Exhaustion', desc: 'Levels 1–6. 1: disadvantage on checks. 2: speed halved. 3: disadv. on attacks/saves. 4: HP max halved. 5: speed 0. 6: death.' },
  { name: 'Passive Perception', desc: '10 + Perception modifier. Used for detecting hidden threats when you\'re not actively searching.' },
]

// ── Detail popup ───────────────────────────────────────────────────────────────
function DetailPopup({ title, desc, onClose }: { title: string; desc: string; onClose: () => void }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, maxWidth: 480, width: '100%', maxHeight: '70vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'var(--bg)', borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text2)' }}>{desc}</div>
      </div>
    </div>
  )
}

// ── Level Up Modal ─────────────────────────────────────────────────────────────
function LevelUpModal({ character: c, onClose }: { character: Character; onClose: () => void }) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const [hpMode, setHpMode] = useState<'avg' | 'roll' | 'manual'>('avg')
  const [manualHp, setManualHp] = useState('')
  const [done, setDone] = useState(false)

  const newLevel = c.level + 1
  const hd = CLASS_HD[c.class] ?? 8
  const avgGain = averageHpGain(hd)
  const rolledGain = rollDie(hd)
  const conMod = mod(c.con)
  const newFeatures = LEVEL_UP_FEATURES[c.class]?.[newLevel] ?? []
  const newSlots = SPELL_SLOTS_TABLE[c.class]?.[newLevel - 1] ?? null

  const getHpGain = () => {
    if (hpMode === 'avg') return avgGain + conMod
    if (hpMode === 'roll') return rolledGain + conMod
    return Math.max(1, parseInt(manualHp) || 1) + conMod
  }

  const doLevelUp = async () => {
    const hpGain = Math.max(1, getHpGain())
    const updates: Partial<Character> = {
      level: newLevel,
      max_hp: c.max_hp + hpGain,
      hp: c.hp + hpGain,
      hit_dice_total: newLevel,
    }
    if (newSlots) updates.spell_slots_used = []
    await patchActiveCharacter(updates)
    showToast(`Level ${newLevel}! +${hpGain} HP`)
    setDone(true)
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Level Up → {newLevel}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: 'var(--bg)', borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal2)' }}>Welcome to level {newLevel}!</div>
            {newFeatures.length > 0 && (
              <div style={{ marginTop: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>New Features</div>
                {newFeatures.map(f => (
                  <div key={f} style={{ padding: '8px 12px', background: 'var(--teal-light)', border: '1px solid var(--teal)', borderRadius: 4, marginBottom: 6, fontSize: 14, fontWeight: 500, color: 'var(--teal2)' }}>★ {f}</div>
                ))}
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: 20, display: 'block', width: '100%', padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}>Done</button>
          </div>
        ) : (
          <>
            {newFeatures.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>New Features at Level {newLevel}</div>
                {newFeatures.map(f => (
                  <div key={f} style={{ padding: '6px 10px', background: '#f8fffe', border: '1px solid var(--border)', borderRadius: 3, marginBottom: 4, fontSize: 13 }}>★ {f}</div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>HP Gain (d{hd} + CON {conMod >= 0 ? '+' : ''}{conMod})</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {(['avg', 'roll', 'manual'] as const).map(m => (
                <button key={m} onClick={() => setHpMode(m)} style={{ flex: 1, padding: '8px 4px', border: `1px solid ${hpMode === m ? 'var(--teal)' : 'var(--border2)'}`, background: hpMode === m ? 'var(--teal)' : 'var(--white)', color: hpMode === m ? '#fff' : 'var(--text2)', fontSize: 13, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', fontWeight: 500 }}>
                  {m === 'avg' ? `Average (${avgGain})` : m === 'roll' ? `Roll (${rolledGain})` : 'Manual'}
                </button>
              ))}
            </div>

            {hpMode === 'manual' && (
              <input type="number" value={manualHp} onChange={e => setManualHp(e.target.value)} placeholder="HP from die roll" min={1} max={hd} style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 15, fontFamily: 'inherit', borderRadius: 3, outline: 'none', marginBottom: 12, color: 'var(--text)', background: 'var(--white)', boxSizing: 'border-box' }} />
            )}

            <div style={{ padding: '10px 12px', background: 'var(--teal-light)', border: '1px solid var(--teal)', borderRadius: 4, marginBottom: 16, fontSize: 14, color: 'var(--teal2)', fontWeight: 500 }}>
              HP gain: +{Math.max(1, getHpGain())} → new max {c.max_hp + Math.max(1, getHpGain())}
            </div>

            {newSlots && (
              <div style={{ padding: '8px 12px', background: '#f3f0ff', border: '1px solid var(--purple)', borderRadius: 4, marginBottom: 16, fontSize: 13, color: 'var(--purple)' }}>
                Spell slots will reset for level {newLevel}.
              </div>
            )}

            <button onClick={doLevelUp} style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}>
              Level Up to {newLevel}!
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── About tab ──────────────────────────────────────────────────────────────────
function AboutTab({ character: c }: { character: Character }) {
  const { patchActiveCharacter } = useCharacterStore()
  const [popup, setPopup] = useState<{ title: string; desc: string } | null>(null)
  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const raceData = RACES[c.race]
  const classData = CLASSES[c.class]
  const bgData = BACKGROUNDS[c.background]

  const startEdit = (field: string, current: string) => {
    setEditField(field)
    setEditVal(current ?? '')
  }

  const commitEdit = async (field: string) => {
    await patchActiveCharacter({ [field]: editVal } as Partial<Character>)
    setEditField(null)
  }

  const bioFields: { key: string; label: string; placeholder: string }[] = [
    { key: 'personality', label: 'Personality', placeholder: 'Personality traits...' },
    { key: 'ideals', label: 'Ideals', placeholder: 'What drives you...' },
    { key: 'bonds', label: 'Bonds', placeholder: 'Connections that matter...' },
    { key: 'flaws', label: 'Flaws', placeholder: 'Flaws and weaknesses...' },
    { key: 'about', label: 'Backstory', placeholder: 'Background and history...' },
  ]

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Racial traits */}
      {raceData?.traitDetails && (
        <div style={{ marginBottom: 1 }}>
          <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--teal2)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)' }}>{c.race} Traits</div>
          {raceData.traitDetails.map(t => (
            <div key={t.name} onClick={() => setPopup({ title: t.name, desc: t.desc })} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
            >
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.name}</div>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Class features */}
      {classData?.features && (
        <div style={{ marginBottom: 1 }}>
          <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)' }}>{c.class} Features</div>
          {classData.features.map(f => (
            <div key={f.name} onClick={() => setPopup({ title: f.name, desc: f.desc })} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
            >
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{f.name}</div>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Background feature */}
      {bgData?.featureDetail && (
        <div style={{ marginBottom: 1 }}>
          <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)' }}>{c.background} Feature</div>
          <div onClick={() => setPopup({ title: bgData.featureDetail!.name, desc: bgData.featureDetail!.desc })} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
          >
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{bgData.featureDetail.name}</div>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>›</span>
          </div>
        </div>
      )}

      {/* Level features for current level */}
      {(LEVEL_UP_FEATURES[c.class]?.[c.level] ?? []).length > 0 && (
        <div style={{ marginBottom: 1 }}>
          <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--teal2)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)' }}>Level {c.level} Features</div>
          {(LEVEL_UP_FEATURES[c.class]![c.level] ?? []).map(f => (
            <div key={f} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, background: 'var(--white)' }}>★ {f}</div>
          ))}
        </div>
      )}

      {/* Bio fields */}
      <div style={{ marginTop: 8 }}>
        <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)' }}>Character Bio</div>
        {bioFields.map(({ key, label, placeholder }) => {
          const val = (c[key] as string) ?? ''
          const isEditing = editField === key
          return (
            <div key={key} style={{ borderBottom: '1px solid var(--border)', padding: '10px 14px', background: 'var(--white)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</span>
                {!isEditing && <button onClick={() => startEdit(key, val)} style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'inherit' }}>Edit</button>}
              </div>
              {isEditing ? (
                <div>
                  <textarea value={editVal} onChange={e => setEditVal(e.target.value)} rows={3} style={{ width: '100%', border: '1px solid var(--border2)', padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', borderRadius: 2, outline: 'none', resize: 'vertical', color: 'var(--text)', background: 'var(--white)', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button onClick={() => commitEdit(key)} style={{ flex: 1, padding: '6px 0', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditField(null)} style={{ flex: 1, padding: '6px 0', background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 13, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: val ? 'var(--text)' : 'var(--text3)', lineHeight: 1.6 }}>{val || placeholder}</div>
              )}
            </div>
          )
        })}
      </div>

      {popup && <DetailPopup title={popup.title} desc={popup.desc} onClose={() => setPopup(null)} />}
    </div>
  )
}

// ── XP / Level Up tab ─────────────────────────────────────────────────────────
function ExpTab({ character: c }: { character: Character }) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const [addXP, setAddXP] = useState('')
  const [showLevelUp, setShowLevelUp] = useState(false)

  const lvl = c.level
  const exp = c.exp ?? 0
  const thisXP = XP_TABLE[Math.min(lvl, 20)] ?? 0
  const nextXP = XP_TABLE[Math.min(lvl + 1, 20)] ?? 0
  const xpRange = nextXP - thisXP
  const xpPct = xpRange > 0 ? Math.min(100, Math.max(0, Math.round((exp - thisXP) / xpRange * 100))) : 100
  const canLevelUp = lvl < 20 && exp >= nextXP

  const doAddXP = async () => {
    const gain = parseInt(addXP)
    if (!gain || gain <= 0) return
    const newExp = exp + gain
    await patchActiveCharacter({ exp: newExp })
    showToast(`+${gain} XP`)
    setAddXP('')
  }

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Big XP display */}
      <div style={{ padding: '20px 14px 16px', background: 'var(--white)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Experience Points</div>
        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'inherit' }}>{exp.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
          {lvl < 20 ? `${(nextXP - exp).toLocaleString()} XP to level ${lvl + 1}` : 'Max level reached'}
        </div>

        {/* XP bar */}
        {lvl < 20 && (
          <div style={{ margin: '12px 0 4px', height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${xpPct}%`, height: '100%', background: canLevelUp ? 'var(--gold)' : 'var(--teal)', borderRadius: 5, transition: 'width .3s' }} />
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Level {lvl} · {xpPct}%{lvl < 20 ? ` toward ${nextXP.toLocaleString()}` : ''}</div>
      </div>

      {/* Add XP */}
      <div style={{ padding: '12px 14px', background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input type="number" value={addXP} onChange={e => setAddXP(e.target.value)} onKeyDown={e => e.key === 'Enter' && doAddXP()} placeholder="Add XP..." min={1} style={{ flex: 1, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
        <button onClick={doAddXP} disabled={!addXP || parseInt(addXP) <= 0} style={{ padding: '8px 18px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', opacity: addXP && parseInt(addXP) > 0 ? 1 : 0.5 }}>+ XP</button>
      </div>

      {/* Level Up button */}
      {canLevelUp && (
        <div style={{ padding: '12px 14px' }}>
          <button onClick={() => setShowLevelUp(true)} style={{ display: 'block', width: '100%', padding: 13, background: 'var(--gold)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            🎉 Level Up to {lvl + 1}!
          </button>
        </div>
      )}

      {/* Milestone table */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '7px 14px', background: '#fafafa', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>XP Milestones</div>
        {Array.from({ length: 20 }, (_, i) => i + 1).map(l => {
          const xpNeeded = XP_TABLE[l] ?? 0
          const isCurrent = l === lvl
          const isPast = l < lvl
          return (
            <div key={l} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: isCurrent ? 'var(--teal-light)' : 'var(--white)' }}>
              <div style={{ width: 28, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--teal2)' : isPast ? 'var(--text3)' : 'var(--text)', fontSize: 14 }}>
                {l}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: isPast ? 'var(--text3)' : isCurrent ? 'var(--teal2)' : 'var(--text)', fontWeight: isCurrent ? 600 : 400 }}>
                {xpNeeded.toLocaleString()} XP
              </div>
              {isCurrent && <span style={{ fontSize: 11, background: 'var(--teal)', color: '#fff', padding: '2px 7px', borderRadius: 2, fontWeight: 600 }}>Current</span>}
              {isPast && <span style={{ fontSize: 13, color: 'var(--text3)' }}>✓</span>}
              <div style={{ marginLeft: 8, fontSize: 12, color: 'var(--text3)', textAlign: 'right', minWidth: 80 }}>
                +{(profBonus(l))} prof
              </div>
            </div>
          )
        })}
      </div>

      {showLevelUp && <LevelUpModal character={c} onClose={() => setShowLevelUp(false)} />}
    </div>
  )
}

// ── Quick Access tab ───────────────────────────────────────────────────────────
function QuickTab() {
  const [popup, setPopup] = useState<{ title: string; desc: string } | null>(null)
  const [section, setSection] = useState<'actions' | 'rules'>('actions')

  const items = section === 'actions' ? COMBAT_ACTIONS : RULES_REFERENCE

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--white)' }}>
        {(['actions', 'rules'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{ flex: 1, padding: '10px 4px', border: 'none', borderBottom: s === section ? '2px solid var(--teal)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: s === section ? 'var(--teal2)' : 'var(--text3)', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.3px' }}>
            {s === 'actions' ? 'Combat Actions' : 'Rules Reference'}
          </button>
        ))}
      </div>
      {items.map(item => (
        <div key={item.name} onClick={() => setPopup({ title: item.name, desc: item.desc })} style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
        >
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</div>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>›</span>
        </div>
      ))}
      {popup && <DetailPopup title={popup.title} desc={popup.desc} onClose={() => setPopup(null)} />}
    </div>
  )
}

// ── Main InfoSheet ─────────────────────────────────────────────────────────────
export default function InfoSheet({ character: c, initialTab = 'about' }: Props) {
  const [tab, setTab] = useState<'about' | 'exp' | 'quick'>(initialTab)

  const TABS: { key: 'about' | 'exp' | 'quick'; label: string }[] = [
    { key: 'about', label: 'About' },
    { key: 'exp', label: 'XP / Level' },
    { key: 'quick', label: 'Quick Ref' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--white)', position: 'sticky', top: 0, zIndex: 10 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '11px 4px', border: 'none', borderBottom: t.key === tab ? '2px solid var(--teal)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: t.key === tab ? 'var(--teal2)' : 'var(--text3)', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: -2 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'about' && <AboutTab character={c} />}
      {tab === 'exp' && <ExpTab character={c} />}
      {tab === 'quick' && <QuickTab />}
    </div>
  )
}
