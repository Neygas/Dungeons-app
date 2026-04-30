import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CreatureAttack } from '@/types'

export interface EncounterCreature {
  name: string
  hp: number
  ac: number
  is_npc: boolean
  attacks: CreatureAttack[]
}

export interface CustomEncounter {
  id: string
  user_id: string
  name: string
  creatures: EncounterCreature[]
  created_at: string
}

interface CustomEncounterState {
  encounters: CustomEncounter[]
  loading: boolean

  load: () => Promise<void>
  save: (name: string, creatures: EncounterCreature[]) => Promise<CustomEncounter | null>
  remove: (id: string) => Promise<void>
}

export const useCustomEncounterStore = create<CustomEncounterState>((set) => ({
  encounters: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('custom_encounters')
      .select('*')
      .order('created_at', { ascending: false })
    set({ encounters: (data ?? []) as CustomEncounter[], loading: false })
  },

  save: async (name, creatures) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('custom_encounters')
      .insert({ name, creatures, user_id: user.id })
      .select()
      .single()
    if (error || !data) return null
    const encounter = data as CustomEncounter
    set(s => ({ encounters: [encounter, ...s.encounters] }))
    return encounter
  },

  remove: async (id) => {
    await supabase.from('custom_encounters').delete().eq('id', id)
    set(s => ({ encounters: s.encounters.filter(e => e.id !== id) }))
  },
}))
