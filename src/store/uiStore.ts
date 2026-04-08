import { create } from 'zustand'

interface Toast {
  id: number
  message: string
}

interface UIState {
  toasts: Toast[]
  editMode: boolean
  activeSheet: 'info' | 'exp' | 'quickref' | 'conditions' | 'tempHp' | 'rest' | null
  showToast: (message: string) => void
  setEditMode: (v: boolean) => void
  openSheet: (sheet: UIState['activeSheet']) => void
  closeSheet: () => void
}

let toastId = 0

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  editMode: false,
  activeSheet: null,

  showToast: (message) => {
    const id = ++toastId
    set(s => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2200)
  },

  setEditMode: (v) => set({ editMode: v }),
  openSheet: (sheet) => set({ activeSheet: sheet }),
  closeSheet: () => set({ activeSheet: null }),
}))
