import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

export type CutsceneType = 'combat-start' | 'short-rest' | 'long-rest' | 'level-up'

interface Cutscene {
  type: CutsceneType
  key: number
  data?: Record<string, unknown>
}

interface UIState {
  toasts: Toast[]
  editMode: boolean
  activeSheet: 'info' | 'exp' | 'quickref' | 'conditions' | 'tempHp' | 'shortRest' | 'longRest' | null
  cutscene: Cutscene | null

  showToast: (message: string) => void
  setEditMode: (v: boolean) => void
  openSheet: (sheet: UIState['activeSheet']) => void
  closeSheet: () => void
  showCutscene: (type: CutsceneType, data?: Record<string, unknown>) => void
  dismissCutscene: () => void
}

let toastId = 0
let cutsceneKey = 0

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  editMode: false,
  activeSheet: null,
  cutscene: null,

  showToast: (message) => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2200)
  },

  setEditMode: (v) => set({ editMode: v }),
  openSheet: (sheet) => set({ activeSheet: sheet }),
  closeSheet: () => set({ activeSheet: null }),

  showCutscene: (type, data) => set({ cutscene: { type, key: ++cutsceneKey, data } }),
  dismissCutscene: () => set({ cutscene: null }),
}))
