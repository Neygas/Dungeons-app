import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ShopItem } from '@/types'

export interface ShopTemplate {
  id: string
  name: string
  items: ShopItem[]
}

interface State {
  templates: ShopTemplate[]
  loading: boolean
  load: () => Promise<void>
  save: (template: Omit<ShopTemplate, 'id'>) => Promise<ShopTemplate | null>
  remove: (id: string) => Promise<void>
}

export const useShopTemplateStore = create<State>((set) => ({
  templates: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('dm_shop_templates')
      .select('*')
      .order('created_at', { ascending: false })
    set({ templates: (data ?? []) as ShopTemplate[], loading: false })
  },

  save: async (template) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('dm_shop_templates')
      .insert({ name: template.name, items: template.items, user_id: user.id })
      .select()
      .single()
    if (error || !data) return null
    const t = data as ShopTemplate
    set(s => ({ templates: [t, ...s.templates] }))
    return t
  },

  remove: async (id) => {
    await supabase.from('dm_shop_templates').delete().eq('id', id)
    set(s => ({ templates: s.templates.filter(t => t.id !== id) }))
  },
}))
