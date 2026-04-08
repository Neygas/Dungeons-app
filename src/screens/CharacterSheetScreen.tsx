import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCharacterStore } from '@/store/characterStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import HPSection, { ConditionsSheet, TempHPSheet, RestSheet } from '@/components/character/HPSection'
import CombatStats from '@/components/character/CombatStats'
import AbilityScores from '@/components/character/AbilityScores'
import SavingThrows from '@/components/character/SavingThrows'
import SkillsSection from '@/components/character/SkillsSection'
import SpellsSection from '@/components/character/SpellsSection'
import WeaponsSection from '@/components/character/WeaponsSection'
import ArmorSection from '@/components/character/ArmorSection'
import InventorySection from '@/components/character/InventorySection'
import BottomSheet from '@/components/shared/BottomSheet'
import Toast from '@/components/shared/Toast'
import { CLASSES, XP_TABLE } from '@/data'

const NAV_TABS = ['Stats', 'Spells', 'Combat', 'Gear']
const SECTION_IDS = ['section-stats', 'section-spells', 'section-combat', 'section-gear']

export default function CharacterSheetScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { characters, activeCharacter, setActiveCharacter, fetchCharacters, loading } = useCharacterStore()
  const { editMode, setEditMode, activeSheet, closeSheet } = useUIStore()

  useEffect(() => {
    if (user && characters.length === 0) fetchCharacters(user.id)
  }, [user, characters.length, fetchCharacters])

  useEffect(() => {
    const found = characters.find(c => c.id === id)
    if (found) setActiveCharacter(found)
  }, [id, characters, setActiveCharacter])

  const scrollToSection = (idx: number) => {
    const el = document.getElementById(SECTION_IDS[idx])
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading && !activeCharacter) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><span style={{ color: 'var(--text3)' }}>Loading...</span></div>
  }

  const c = activeCharacter
  if (!c) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'var(--text3)', marginBottom: 16 }}>Character not found.</div>
        <button onClick={() => navigate('/characters')} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back to characters</button>
      </div>
    )
  }

  const lvl = c.level
  const exp = c.exp ?? 0
  const nextXP = XP_TABLE[Math.min(lvl + 1, 20)] ?? 0
  const thisXP = XP_TABLE[Math.min(lvl, 20)] ?? 0
  const xpRange = nextXP - thisXP
  const xpPct = xpRange > 0 ? Math.min(100, Math.max(0, Math.round((exp - thisXP) / xpRange * 100))) : 0
  const hasSpells = CLASSES[c.class]?.spellcasting !== null || (c.spells?.length ?? 0) > 0

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--teal)' }}>
        <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48 }}>
          <button onClick={() => navigate('/characters')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Back</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{c.name}</div>
            <div style={{ fontSize: 11, opacity: .85 }}>Lvl {lvl} {c.race} {c.class}</div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            style={{ background: editMode ? 'rgba(255,255,255,.25)' : 'none', border: editMode ? '1px solid rgba(255,255,255,.5)' : 'none', color: '#fff', fontSize: 18, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
            title="Edit mode"
          >
            ✏️
          </button>
        </div>

        {/* XP bar */}
        <div style={{ background: 'var(--teal2)', height: 3 }}>
          <div style={{ background: 'rgba(255,255,255,.5)', height: 3, width: `${xpPct}%`, transition: 'width .3s' }} />
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '2px solid var(--border)' }}>
          {NAV_TABS.map((tab, i) => {
            if (tab === 'Spells' && !hasSpells) return null
            return (
              <button key={tab} onClick={() => scrollToSection(i)} style={{ flex: 1, padding: '9px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', border: 'none', background: 'none', cursor: 'pointer', letterSpacing: '.3px', fontFamily: 'inherit' }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Inspiration row */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Inspiration</span>
        <div
          onClick={() => useCharacterStore.getState().patchActiveCharacter({ inspiration: !c.inspiration })}
          style={{ width: 44, height: 24, borderRadius: 12, border: `2px solid ${c.inspiration ? 'var(--teal2)' : 'var(--border2)'}`, background: c.inspiration ? 'var(--teal)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}
        >
          <div style={{ position: 'absolute', top: 2, left: c.inspiration ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
        </div>
      </div>

      {/* ── STATS SECTION ── */}
      <div id="section-stats" style={{ paddingTop: 8 }}>
        <HPSection character={c} />
        <CombatStats character={c} />
        <AbilityScores character={c} />
        <SavingThrows character={c} />
        <SkillsSection character={c} />
      </div>

      {/* ── SPELLS SECTION ── */}
      {hasSpells && (
        <div id="section-spells" style={{ paddingTop: 8 }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>— Spells —</span>
          </div>
          <SpellsSection character={c} />
        </div>
      )}

      {/* ── COMBAT SECTION ── */}
      <div id="section-combat" style={{ paddingTop: 8 }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>— Weapons & Armor —</span>
        </div>
        <WeaponsSection character={c} />
        <ArmorSection character={c} />
      </div>

      {/* ── GEAR SECTION ── */}
      <div id="section-gear" style={{ paddingTop: 8 }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>— Inventory & Currency —</span>
        </div>
        <InventorySection character={c} />
      </div>

      {/* ── BOTTOM SHEETS ── */}
      <BottomSheet open={activeSheet === 'conditions'} onClose={closeSheet} title="Conditions">
        <ConditionsSheet character={c} />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'tempHp'} onClose={closeSheet} title="Temporary HP">
        <TempHPSheet character={c} />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'rest'} onClose={closeSheet} title="Take a Rest">
        <RestSheet character={c} />
      </BottomSheet>

      <Toast />

      {/* Edit mode indicator */}
      {editMode && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--teal)', color: '#fff', padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 90, boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
          Edit Mode — tap ✏️ to exit
        </div>
      )}
    </div>
  )
}
