import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type CatalogType = 'weapon' | 'spell' | 'item'

export interface CustomCatalogEntry {
  id: string
  user_id: string
  type: CatalogType
  name: string
  data: Record<string, unknown>
  created_at: string
}

interface State {
  entries: CustomCatalogEntry[]
  loading: boolean
  load: () => Promise<void>
  save: (entry: Omit<CustomCatalogEntry, 'id' | 'user_id' | 'created_at'>) => Promise<CustomCatalogEntry | null>
  remove: (id: string) => Promise<void>
}

export const useCustomPlayerCatalogStore = create<State>((set) => ({
  entries: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('custom_player_catalog')
      .select('*')
      .order('created_at', { ascending: false })
    set({ entries: (data ?? []) as CustomCatalogEntry[], loading: false })
  },

  save: async (entry) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('custom_player_catalog')
      .insert({ ...entry, user_id: user.id })
      .select()
      .single()
    if (error || !data) return null
    const e = data as CustomCatalogEntry
    set(s => ({ entries: [e, ...s.entries] }))
    return e
  },

  remove: async (id) => {
    await supabase.from('custom_player_catalog').delete().eq('id', id)
    set(s => ({ entries: s.entries.filter(e => e.id !== id) }))
  },
}))
