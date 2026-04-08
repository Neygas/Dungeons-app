import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCharacterStore } from '@/store/characterStore'
import { useAuthStore } from '@/store/authStore'

export default function CharacterSheetScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const { characters, activeCharacter, setActiveCharacter, fetchCharacters, loading } = useCharacterStore()

  useEffect(() => {
    if (user && characters.length === 0) fetchCharacters(user.id)
  }, [user, characters.length, fetchCharacters])

  useEffect(() => {
    const found = characters.find(c => c.id === id)
    if (found) setActiveCharacter(found)
  }, [id, characters, setActiveCharacter])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ color: 'var(--text3)' }}>Loading...</span>
      </div>
    )
  }

  if (!activeCharacter) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ color: 'var(--text3)', marginBottom: 16 }}>Character not found.</div>
        <button onClick={() => navigate('/characters')} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back to characters</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/characters')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Back</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{activeCharacter.name}</span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>Lvl {activeCharacter.level} {activeCharacter.class}</span>
      </div>

      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text3)', fontSize: 14, paddingTop: 40 }}>
        Full character sheet coming next — this is the scaffold.
        <br /><br />
        <strong style={{ color: 'var(--teal2)' }}>{activeCharacter.name}</strong><br />
        Level {activeCharacter.level} {activeCharacter.race} {activeCharacter.class}<br />
        HP: {activeCharacter.hp} / {activeCharacter.max_hp}
      </div>
    </div>
  )
}
