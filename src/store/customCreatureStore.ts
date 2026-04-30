import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CreatureAttack } from '@/types'

export interface CustomCreature {
  id: string
  user_id: string
  name: string
  hp: number
  ac: number
  is_npc: boolean
  attacks: CreatureAttack[]
  created_at: string
}

interface CustomCreatureState {
  creatures: CustomCreature[]
  loading: boolean

  load: () => Promise<void>
  save: (c: Omit<CustomCreature, 'id' | 'user_id' | 'created_at'>) => Promise<CustomCreature | null>
  remove: (id: string) => Promise<void>
}

export const useCustomCreatureStore = create<CustomCreatureState>((set, get) => ({
  creatures: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('custom_creatures')
      .select('*')
      .order('created_at', { ascending: false })
    set({ creatures: (data ?? []) as CustomCreature[], loading: false })
  },

  save: async (c) => {
    const { data, error } = await supabase
      .from('custom_creatures')
      .insert(c)
      .select()
      .single()
    if (error || !data) return null
    const creature = data as CustomCreature
    set(s => ({ creatures: [creature, ...s.creatures] }))
    return creature
  },

  remove: async (id) => {
    await supabase.from('custom_creatures').delete().eq('id', id)
    set(s => ({ creatures: s.creatures.filter(c => c.id !== id) }))
  },
}))
