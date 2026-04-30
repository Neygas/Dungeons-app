import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { LootTemplate } from '@/data/lootTemplates'

const LEGACY_KEY = 'dnd_loot_templates'

interface LootTemplateState {
  templates: LootTemplate[]
  loading: boolean

  load: () => Promise<void>
  save: (template: Omit<LootTemplate, 'id'>) => Promise<LootTemplate | null>
  remove: (id: string) => Promise<void>
}

export const useLootTemplateStore = create<LootTemplateState>((set) => ({
  templates: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('dm_loot_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      set({ templates: data as LootTemplate[], loading: false })
      return
    }

    // Migrate from localStorage if Supabase is empty
    try {
      const local = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]') as LootTemplate[]
      if (local.length > 0) {
        const inserts = local.map(t => ({ name: t.name, rarity: t.rarity, items: t.items }))
        const { data: migrated } = await supabase
          .from('dm_loot_templates')
          .insert(inserts)
          .select()
        if (migrated) {
          localStorage.removeItem(LEGACY_KEY)
          set({ templates: migrated as LootTemplate[], loading: false })
          return
        }
      }
    } catch { /* ignore */ }

    set({ templates: [], loading: false })
  },

  save: async (template) => {
    const { data, error } = await supabase
      .from('dm_loot_templates')
      .insert({ name: template.name, rarity: template.rarity, items: template.items })
      .select()
      .single()
    if (error || !data) return null
    const t = data as LootTemplate
    set(s => ({ templates: [t, ...s.templates] }))
    return t
  },

  remove: async (id) => {
    await supabase.from('dm_loot_templates').delete().eq('id', id)
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }))
  },
}))
