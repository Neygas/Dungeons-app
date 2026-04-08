import { useEffect, useRef, useState } from 'react'
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
import InfoSheet from '@/components/character/InfoSheet'
import BottomSheet from '@/components/shared/BottomSheet'
import Toast from '@/components/shared/Toast'
import { CLASSES, XP_TABLE } from '@/data'

const NAV_TABS = ['Stats', 'Spells', 'Combat', 'Gear']
const SECTION_IDS = ['section-stats', 'section-spells', 'section-combat', 'section-gear']

// ── Photo modal ────────────────────────────────────────────────────────────────
function PhotoModal({ current, onSave, onClose }: { current: string; onSave: (url: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(current ?? '')
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--white)', borderRadius: 10, width: '100%', maxWidth: 380, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Character Photo</div>
        {val && <img src={val} alt="" style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover', display: 'block', margin: '0 auto 12px', border: '2px solid var(--border)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        <input value={val} onChange={e => setVal(e.target.value)} placeholder="Paste image URL..." style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', marginBottom: 10, color: 'var(--text)', background: 'var(--white)', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { onSave(val); onClose() }} style={{ flex: 1, padding: 10, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>Save</button>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 14, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function CharacterSheetScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { characters, activeCharacter, setActiveCharacter, fetchCharacters, loading } = useCharacterStore()
  const { editMode, setEditMode, activeSheet, openSheet, closeSheet } = useUIStore()
  const [collapsed, setCollapsed] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [infoInitialTab, setInfoInitialTab] = useState<'about' | 'exp' | 'quick'>('about')
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    if (user && characters.length === 0) fetchCharacters(user.id)
  }, [user, characters.length, fetchCharacters])

  useEffect(() => {
    const found = characters.find(c => c.id === id)
    if (found) setActiveCharacter(found)
  }, [id, characters, setActiveCharacter])

  // Scroll-based header collapse
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const y = el.scrollTop
      if (y > 60 && !collapsed) setCollapsed(true)
      else if (y < 20 && collapsed) setCollapsed(false)
      lastScrollY.current = y
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [collapsed])

  const scrollToSection = (idx: number) => {
    const el = document.getElementById(SECTION_IDS[idx])
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const savePhoto = async (url: string) => {
    await useCharacterStore.getState().patchActiveCharacter({ photo_url: url })
  }

  if (loading && !activeCharacter) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><span style={{ color: 'var(--text3)' }}>Loading...</span></div>
  }

  const c = activeCharacter
  if (!c) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'var(--text3)', marginBottom: 16 }}>Character not found.</div>
        <button onClick={() => navigate('/characters')} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Back to characters</button>
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
  const photoUrl = c.photo_url
  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div ref={scrollRef} style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80, height: '100vh', overflowY: 'auto' }}>
      {/* Sticky header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--teal)' }}>

        {collapsed ? (
          /* ── Collapsed header ── */
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 44, gap: 8 }}>
            <button onClick={() => navigate('/characters')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px 2px', flexShrink: 0 }}>Back</button>
            {/* Avatar small — tap for photo */}
            <div onClick={() => setShowPhotoModal(true)} style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.4)', flexShrink: 0, cursor: 'pointer', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{initials}</span>}
            </div>
            {/* Name — gold when inspired */}
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: c.inspiration ? 'var(--gold)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color .3s' }}>{c.name}</div>
            {/* Info button */}
            <button onClick={() => { setInfoInitialTab('about'); openSheet('info') }} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '3px 8px', borderRadius: 4, flexShrink: 0, fontFamily: 'inherit' }}>Info</button>
          </div>
        ) : (
          /* ── Expanded header ── */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 12 }}>
              {/* Avatar large — tap for photo */}
              <div onClick={() => setShowPhotoModal(true)} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '2px solid rgba(255,255,255,.5)', flexShrink: 0, cursor: 'pointer', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{initials}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name — gold when inspired */}
                <div style={{ fontSize: 18, fontWeight: 700, color: c.inspiration ? 'var(--gold)' : '#fff', lineHeight: 1.2, transition: 'color .3s' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>Level {lvl} {c.race} {c.class}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 1 }}>{c.background} · {c.alignment}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <button onClick={() => navigate('/characters')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Back</button>
                <button onClick={() => { setInfoInitialTab('about'); openSheet('info') }} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 10px', borderRadius: 4, fontFamily: 'inherit' }}>Info</button>
              </div>
            </div>

            {/* XP bar */}
            <div style={{ margin: '0 14px 10px', position: 'relative' }}>
              <div style={{ background: 'rgba(0,0,0,.25)', height: 6, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                {/* Track label when empty */}
                {xpPct === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: 1, fontWeight: 600, textTransform: 'uppercase' }}>XP</span>
                  </div>
                )}
                <div style={{ background: 'rgba(255,255,255,.7)', height: '100%', width: `${xpPct}%`, borderRadius: 3, transition: 'width .3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>Lvl {lvl} · {exp.toLocaleString()} XP</span>
                {lvl < 20 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>{nextXP.toLocaleString()} XP</span>}
              </div>
            </div>
          </div>
        )}

        {/* Nav tabs */}
        <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '2px solid var(--border)' }}>
          {NAV_TABS.map((tab, i) => {
            if (tab === 'Spells' && !hasSpells) return null
            return (
              <button key={tab} onClick={() => scrollToSection(i)} style={{ flex: 1, padding: '9px 2px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', border: 'none', background: 'none', cursor: 'pointer', letterSpacing: '.3px', fontFamily: 'inherit' }}>
                {tab}
              </button>
            )
          })}
        </div>
      </div>

      {/* Inspiration row */}
      <div style={{ background: c.inspiration ? '#fffbeb' : 'var(--white)', border: `1px solid ${c.inspiration ? 'var(--gold)' : 'var(--border)'}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .3s' }}>
        <span style={{ fontSize: 13, fontWeight: c.inspiration ? 700 : 500, color: c.inspiration ? 'var(--gold)' : 'var(--text)', transition: 'color .3s' }}>
          {c.inspiration ? 'Inspired!' : 'Inspiration'}
        </span>
        <div
          onClick={() => useCharacterStore.getState().patchActiveCharacter({ inspiration: !c.inspiration })}
          style={{ width: 44, height: 24, borderRadius: 12, border: `2px solid ${c.inspiration ? 'var(--gold)' : 'var(--border2)'}`, background: c.inspiration ? 'var(--gold)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}
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
      <BottomSheet open={activeSheet === 'info'} onClose={closeSheet} title="Character Info">
        <InfoSheet character={c} initialTab={infoInitialTab} />
      </BottomSheet>

      <Toast />

      {/* Edit mode indicator */}
      {editMode && (
        <div onClick={() => setEditMode(false)} style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'var(--teal)', color: '#fff', padding: '9px 22px', borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 90, boxShadow: '0 4px 16px rgba(0,0,0,.2)', cursor: 'pointer', userSelect: 'none' }}>
          Edit Mode — tap here to exit
        </div>
      )}

      {/* Photo modal */}
      {showPhotoModal && (
        <PhotoModal current={c.photo_url ?? ''} onSave={savePhoto} onClose={() => setShowPhotoModal(false)} />
      )}
    </div>
  )
}
