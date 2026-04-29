import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
import PageTransition from '@/components/shared/PageTransition'

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: value ? 'var(--teal)' : 'var(--border2)',
        position: 'relative', cursor: 'pointer', flexShrink: 0,
        transition: 'background 200ms',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 23 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)',
        transition: 'left 200ms',
      }} />
    </div>
  )
}

function SettingRow({ label, sublabel, value, onChange }: {
  label: string
  sublabel?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sublabel}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  const { vibrationsEnabled, setVibrationsEnabled } = useSettingsStore()

  return (
    <PageTransition>
      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => navigate('/characters')} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '5px 10px', borderRadius: 3, fontFamily: 'inherit' }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Settings</span>
          <div style={{ width: 64 }} />
        </div>

        <div style={{ padding: '20px 0 0' }}>
          {/* Section: Feedback */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', padding: '0 16px 8px' }}>Feedback</div>
          <div style={{ border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}>
            <SettingRow
              label="Vibrations"
              sublabel="Haptic feedback on actions like rolling dice, taking damage, or level up"
              value={vibrationsEnabled}
              onChange={setVibrationsEnabled}
            />
          </div>

          {/* Section: Account */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', padding: '24px 16px 8px' }}>Account</div>
          <div style={{ border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}>
            <button
              onClick={signOut}
              style={{ display: 'block', width: '100%', padding: '14px 16px', background: 'var(--white)', border: 'none', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 500, color: 'var(--red)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              Sign out
            </button>
          </div>

          <div style={{ padding: '32px 16px 0', fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
            D&amp;D Companion · 5th Edition tools
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
