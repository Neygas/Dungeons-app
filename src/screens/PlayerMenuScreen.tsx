import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCharacterStore } from '@/store/characterStore'
import type { Character } from '@/types'

function classIcon(cls: string) {
  const icons: Record<string, string> = {
    Barbarian: '⚔️', Bard: '🎵', Cleric: '✝️', Druid: '🌿', Fighter: '🛡️',
    Monk: '👊', Paladin: '⚜️', Ranger: '🏹', Rogue: '🗡️', Sorcerer: '✨',
    Warlock: '🔮', Wizard: '📚',
  }
  return icons[cls] ?? '🎲'
}

function CharacterCard({ character, onClick }: { character: Character; onClick: () => void }) {
  const hpPercent = character.max_hp > 0 ? character.hp / character.max_hp : 1
  const hpColor = hpPercent > 0.5 ? 'var(--green)' : hpPercent > 0.2 ? 'var(--orange)' : 'var(--red)'

  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-light)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
    >
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal-light)', border: '2px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {character.photo_url
          ? <img src={character.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : classIcon(character.class)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{character.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Level {character.level} {character.race} {character.class}</div>
        <div style={{ marginTop: 6, background: '#eee', height: 4, borderRadius: 2 }}>
          <div style={{ height: 4, borderRadius: 2, background: hpColor, width: `${Math.max(0, Math.min(100, hpPercent * 100))}%`, transition: 'width .3s' }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: hpColor }}>{character.hp}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>/ {character.max_hp} HP</div>
      </div>
    </div>
  )
}

export default function PlayerMenuScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { characters, loading, fetchCharacters } = useCharacterStore()

  useEffect(() => {
    if (user) fetchCharacters(user.id)
  }, [user, fetchCharacters])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Home</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>My Characters</span>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>Sign out</button>
      </div>

      <div style={{ padding: '0 0' }}>
        {/* Section header */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Characters</span>
          <button
            onClick={() => navigate('/characters/new')}
            style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}
          >
            + New Character
          </button>
        </div>

        {loading && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            Loading...
          </div>
        )}

        {!loading && characters.length === 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎲</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No characters yet</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Create your first character to get started</div>
            <button
              onClick={() => navigate('/characters/new')}
              style={{ display: 'inline-block', padding: '11px 24px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
            >
              Create Character
            </button>
          </div>
        )}

        {characters.map(c => (
          <CharacterCard
            key={c.id}
            character={c}
            onClick={() => navigate(`/characters/${c.id}`)}
          />
        ))}
      </div>

      {/* Join session */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Join a Session</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Session code (e.g. SWORD)"
              style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
            <button style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
