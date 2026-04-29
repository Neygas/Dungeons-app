import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  vibrationsEnabled: boolean
  setVibrationsEnabled: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vibrationsEnabled: true,
      setVibrationsEnabled: (v) => set({ vibrationsEnabled: v }),
    }),
    { name: 'dnd-settings' }
  )
)
