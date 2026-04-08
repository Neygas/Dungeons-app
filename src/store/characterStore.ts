import { create } from 'zustand'
import type { Character } from '@/types'
import { supabase } from '@/lib/supabase'

interface CharacterState {
  characters: Character[]
  activeCharacter: Character | null
  loading: boolean
  error: string | null

  fetchCharacters: (userId: string) => Promise<void>
  setActiveCharacter: (character: Character | null) => void
  createCharacter: (character: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => Promise<Character>
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  patchActiveCharacter: (updates: Partial<Character>) => Promise<void>
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  activeCharacter: null,
  loading: false,
  error: null,

  fetchCharacters: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
    } else {
      set({ characters: data ?? [], loading: false })
    }
  },

  setActiveCharacter: (character) => set({ activeCharacter: character }),

  createCharacter: async (character) => {
    const { data, error } = await supabase
      .from('characters')
      .insert(character)
      .select()
      .single()

    if (error) throw new Error(error.message)

    set(state => ({ characters: [data, ...state.characters] }))
    return data as Character
  },

  updateCharacter: async (id, updates) => {
    const { error } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)

    set(state => ({
      characters: state.characters.map(c => c.id === id ? { ...c, ...updates } : c),
      activeCharacter: state.activeCharacter?.id === id
        ? { ...state.activeCharacter, ...updates }
        : state.activeCharacter,
    }))
  },

  deleteCharacter: async (id) => {
    const { error } = await supabase.from('characters').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set(state => ({
      characters: state.characters.filter(c => c.id !== id),
      activeCharacter: state.activeCharacter?.id === id ? null : state.activeCharacter,
    }))
  },

  patchActiveCharacter: async (updates) => {
    const { activeCharacter } = get()
    if (!activeCharacter) return
    await get().updateCharacter(activeCharacter.id, updates)
  },
}))
