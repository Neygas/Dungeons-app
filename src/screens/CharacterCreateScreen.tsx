import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCharacterStore } from '@/store/characterStore'
import type { WizardState } from '@/types'
import { RACE_NAMES, CLASS_NAMES, BACKGROUND_NAMES, ALIGNMENTS, CLASSES, CLASS_HD, SPELL_SLOTS_TABLE, BACKGROUNDS } from '@/data'
import { AB_KEYS, AB_LABEL, POINT_BUY_COST, STANDARD_ARRAY } from '@/data'
import { mod, averageHpGain, rollDie } from '@/lib/calculations'

const INIT_WIZ: WizardState = {
  name: '', race: 'Human', class: 'Fighter', level: 1, hpMode: 'avg',
  system: 'custom', str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  background: 'Acolyte', alignment: 'True Neutral',
  personality: '', ideals: '', bonds: '', flaws: '', about: '', skills: [],
}

function Step1({ wiz, setWiz }: { wiz: WizardState; setWiz: (w: WizardState) => void }) {
  const f = (k: keyof WizardState, v: unknown) => setWiz({ ...wiz, [k]: v })
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Character Name</label>
        <input value={wiz.name} onChange={e => f('name', e.target.value)} style={inp} placeholder="Aragorn" />
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Race</label>
          <select value={wiz.race} onChange={e => f('race', e.target.value)} style={sel}>
            {RACE_NAMES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Class</label>
          <select value={wiz.class} onChange={e => f('class', e.target.value)} style={sel}>
            {CLASS_NAMES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Level</label>
          <select value={wiz.level} onChange={e => f('level', Number(e.target.value))} style={sel}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Starting HP</label>
          <select value={wiz.hpMode} onChange={e => f('hpMode', e.target.value)} style={sel}>
            <option value="max">Maximum</option>
            <option value="avg">Average</option>
            <option value="roll">Roll</option>
          </select>
        </div>
      </div>
      <div style={{ background: 'var(--teal-light)', borderLeft: '3px solid var(--teal)', padding: '9px 12px', fontSize: 13, color: 'var(--teal2)' }}>
        <strong>{wiz.class}</strong> — Hit Die: d{CLASS_HD[wiz.class]}, Saves: {CLASSES[wiz.class].save.join(' & ')}
      </div>
    </div>
  )
}

function Step2({ wiz, setWiz }: { wiz: WizardState; setWiz: (w: WizardState) => void }) {
  const f = (k: keyof WizardState, v: unknown) => setWiz({ ...wiz, [k]: v })
  const totalCost = AB_KEYS.reduce((sum, k) => sum + (POINT_BUY_COST[(wiz as Record<string, number>)[k]] ?? 0), 0)
  const remaining = 27 - totalCost

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {(['custom', 'pointbuy', 'standard'] as const).map(s => (
          <button key={s} onClick={() => f('system', s)} style={{ flex: 1, padding: '8px 4px', border: `1px solid ${wiz.system === s ? 'var(--teal)' : 'var(--border2)'}`, background: wiz.system === s ? 'var(--teal)' : 'var(--white)', color: wiz.system === s ? '#fff' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.3px' }}>
            {s === 'custom' ? 'Custom' : s === 'pointbuy' ? 'Point Buy' : 'Standard'}
          </button>
        ))}
      </div>

      {wiz.system === 'pointbuy' && (
        <div style={{ marginBottom: 12, fontSize: 13, color: remaining >= 0 ? 'var(--teal2)' : 'var(--red)', fontWeight: 600 }}>
          Points remaining: {remaining} / 27
        </div>
      )}

      {wiz.system === 'standard' && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text3)' }}>
          Assign these values: {STANDARD_ARRAY.join(', ')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {AB_KEYS.map(k => {
          const val = (wiz as Record<string, number>)[k]
          return (
            <div key={k} style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '10px 8px', textAlign: 'center', borderRadius: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{AB_LABEL[k]}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {wiz.system !== 'custom' && (
                  <button onClick={() => val > 8 && f(k, val - 1)} style={adjBtn}>−</button>
                )}
                <input
                  type="number"
                  value={val}
                  min={1} max={20}
                  onChange={e => f(k, Math.min(20, Math.max(1, Number(e.target.value))))}
                  readOnly={wiz.system !== 'custom'}
                  style={{ width: 44, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit', color: 'var(--text)' }}
                />
                {wiz.system !== 'custom' && (
                  <button onClick={() => val < 15 && f(k, val + 1)} style={adjBtn}>+</button>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal2)', marginTop: 4 }}>
                {mod(val) >= 0 ? '+' : ''}{mod(val)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step3({ wiz, setWiz }: { wiz: WizardState; setWiz: (w: WizardState) => void }) {
  const f = (k: keyof WizardState, v: unknown) => setWiz({ ...wiz, [k]: v })
  const dndClass = CLASSES[wiz.class]
  const bgSkills = BACKGROUNDS[wiz.background]?.skills ?? []
  const availableSkills = dndClass.skills.filter((s: string) => !bgSkills.includes(s))
  const maxSkills = dndClass.numSkills

  const toggleSkill = (s: string) => {
    const has = wiz.skills.includes(s)
    if (has) setWiz({ ...wiz, skills: wiz.skills.filter(x => x !== s) })
    else if (wiz.skills.length < maxSkills) setWiz({ ...wiz, skills: [...wiz.skills, s] })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Background</label>
          <select value={wiz.background} onChange={e => f('background', e.target.value)} style={sel}>
            {BACKGROUND_NAMES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, marginBottom: 16 }}>
          <label style={lbl}>Alignment</label>
          <select value={wiz.alignment} onChange={e => f('alignment', e.target.value)} style={sel}>
            {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
          Class Skills — choose {maxSkills} ({wiz.skills.length}/{maxSkills})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {bgSkills.map(s => (
            <span key={s} style={{ padding: '4px 10px', border: '1px solid var(--teal)', background: 'var(--teal-light)', fontSize: 12, borderRadius: 2, color: 'var(--teal2)' }}>{s} ✓</span>
          ))}
          {availableSkills.map(s => {
            const selected = wiz.skills.includes(s)
            return (
              <button key={s} onClick={() => toggleSkill(s)} style={{ padding: '4px 10px', border: `1px solid ${selected ? 'var(--purple)' : 'var(--border2)'}`, background: selected ? 'var(--purple-light)' : 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, color: selected ? 'var(--purple)' : 'var(--text2)', fontFamily: 'inherit', fontWeight: selected ? 600 : 400 }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {[{ k: 'personality' as const, label: 'Personality Traits' }, { k: 'ideals' as const, label: 'Ideals' }, { k: 'bonds' as const, label: 'Bonds' }, { k: 'flaws' as const, label: 'Flaws' }].map(({ k, label }) => (
        <div key={k} style={{ marginBottom: 12 }}>
          <label style={lbl}>{label}</label>
          <textarea value={wiz[k]} onChange={e => f(k, e.target.value)} style={{ ...inp, resize: 'vertical', minHeight: 50, border: '1px solid var(--border2)', padding: 8, borderRadius: 2 }} rows={2} />
        </div>
      ))}
    </div>
  )
}

function Step4({ wiz }: { wiz: WizardState }) {
  const bgSkills = BACKGROUNDS[wiz.background]?.skills ?? []
  const allSkills = [...new Set([...bgSkills, ...wiz.skills])]
  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {[['Name', wiz.name || '—'], ['Race', wiz.race], ['Class', wiz.class], ['Level', String(wiz.level)], ['Background', wiz.background], ['Alignment', wiz.alignment]].map(([k, v]) => (
          <div key={k}>
            <span style={{ fontWeight: 600, color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</span>
            <div style={{ color: 'var(--text)', marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 600, color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Ability Scores</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AB_KEYS.map(k => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{AB_LABEL[k]}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{(wiz as Record<string, number>)[k]}</div>
              <div style={{ fontSize: 12, color: 'var(--teal2)', fontWeight: 600 }}>{mod((wiz as Record<string, number>)[k]) >= 0 ? '+' : ''}{mod((wiz as Record<string, number>)[k])}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Skills</div>
        <div style={{ color: 'var(--text)' }}>{allSkills.length > 0 ? allSkills.join(', ') : '—'}</div>
      </div>
    </div>
  )
}

function calcMaxHp(wiz: WizardState): number {
  const hd = CLASS_HD[wiz.class]
  const conMod = mod(wiz.con)
  if (wiz.hpMode === 'max') return hd + conMod
  if (wiz.hpMode === 'avg') return averageHpGain(hd) + conMod
  return rollDie(hd) + conMod
}

// Shared styles
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }
const inp: React.CSSProperties = { width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }
const sel: React.CSSProperties = { width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }
const adjBtn: React.CSSProperties = { width: 24, height: 24, border: '1px solid var(--border2)', background: 'var(--white)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, color: 'var(--text2)', fontFamily: 'inherit', padding: 0 }

const STEPS = ['Basics', 'Abilities', 'Background', 'Review']

export default function CharacterCreateScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createCharacter } = useCharacterStore()
  const [step, setStep] = useState(0)
  const [wiz, setWiz] = useState<WizardState>(INIT_WIZ)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canNext = () => {
    if (step === 0) return wiz.name.trim().length > 0
    if (step === 2) {
      const needed = CLASSES[wiz.class].numSkills
      return wiz.skills.length === needed
    }
    return true
  }

  const handleCreate = async () => {
    if (!user) return
    setSaving(true)
    setError('')

    const maxHp = Math.max(1, calcMaxHp(wiz))
    const bgSkills = BACKGROUNDS[wiz.background]?.skills ?? []
    const allSkills = [...new Set([...bgSkills, ...wiz.skills])]
    const slotTable = SPELL_SLOTS_TABLE[wiz.class]
    const spellSlots = slotTable ? (slotTable[wiz.level - 1] ?? []) : []

    try {
      const char = await createCharacter({
        user_id: user.id,
        name: wiz.name.trim(),
        race: wiz.race,
        class: wiz.class,
        level: wiz.level,
        background: wiz.background,
        alignment: wiz.alignment,
        photo_url: undefined,
        str: wiz.str, dex: wiz.dex, con: wiz.con,
        int: wiz.int, wis: wiz.wis, cha: wiz.cha,
        hp: maxHp, max_hp: maxHp, temp_hp: 0,
        death_successes: 0, death_failures: 0, is_stable: false, is_dead: false,
        hit_dice_total: wiz.level, hit_dice_used: 0,
        skill_proficiencies: allSkills, skill_expertise: [],
        skill_overrides: {}, save_proficiencies: CLASSES[wiz.class].save,
        save_overrides: {},
        spells: [], spell_slots_used: spellSlots.map(() => 0),
        concentration_spell: null,
        weapons: [], active_weapon: null, weapon_finesse_choices: {},
        armor: [], equipped_armor: null, equipped_shield: false,
        inventory: [],
        pp: 0, gp: 0, ep: 0, sp: 0, cp: 0,
        exp: 0, inspiration: false, conditions: [],
        personality: wiz.personality, ideals: wiz.ideals,
        bonds: wiz.bonds, flaws: wiz.flaws, about: wiz.about,
      })
      navigate(`/characters/${char.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create character')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/characters')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>
          {step > 0 ? '← Back' : '✕ Cancel'}
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>New Character</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>{step + 1}/{STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--teal2)', height: 3 }}>
        <div style={{ background: 'rgba(255,255,255,.5)', height: 3, width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width .3s' }} />
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--white)' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === step ? 'var(--teal)' : 'var(--text3)', borderBottom: i === step ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -2, letterSpacing: '.3px', whiteSpace: 'nowrap' }}>
            {s}
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {error && <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 2, fontSize: 13, background: '#fde8e8', color: 'var(--red)', border: '1px solid var(--red)' }}>{error}</div>}

        {step === 0 && <Step1 wiz={wiz} setWiz={setWiz} />}
        {step === 1 && <Step2 wiz={wiz} setWiz={setWiz} />}
        {step === 2 && <Step3 wiz={wiz} setWiz={setWiz} />}
        {step === 3 && <Step4 wiz={wiz} />}
      </div>

      {/* Footer nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '12px 16px', maxWidth: 600, margin: '0 auto' }}>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal2)', fontSize: 15, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', borderRadius: 2, fontFamily: 'inherit', opacity: canNext() ? 1 : 0.5 }}
          >
            Continue → {STEPS[step + 1]}
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Creating...' : 'Create Character'}
          </button>
        )}
      </div>
    </div>
  )
}
