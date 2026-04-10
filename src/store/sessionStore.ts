import { create } from 'zustand'
import type { Character, Session, CombatLogEntry, CombatLogType, LootItem, ShopItem, InitiativeEntry } from '@/types'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const SESSION_KEY = 'dnd_active_sessions' // localStorage key: JSON map of charId → sessionId

interface SessionState {
  activeSession: Session | null
  playerCharacters: Character[]
  combatLog: CombatLogEntry[]
  loading: boolean
  error: string | null

  // Player-side: charId → sessionId map
  joinedSessions: Record<string, string>

  // Internal realtime channels
  _sessionChannel: RealtimeChannel | null
  _playersChannel: RealtimeChannel | null
  _logChannel: RealtimeChannel | null

  // Load & subscribe (DM)
  loadSession: (id: string) => Promise<void>
  subscribeAll: (sessionId: string) => void
  unsubscribeAll: () => void

  // Player join/leave
  joinSession: (code: string, characterId: string) => Promise<string | null>
  leaveSession: (characterId: string) => Promise<void>
  getJoinedSession: (characterId: string) => string | null

  // Subscribe player to session updates
  subscribeToSession: (sessionId: string, characterId: string) => (() => void)

  // DM modifies a player character
  dmPatchCharacter: (charId: string, updates: Partial<Character>) => Promise<void>

  // Initiative
  patchSession: (updates: Partial<Session>) => Promise<void>
  setInitiative: (order: InitiativeEntry[]) => Promise<void>
  nextTurn: () => Promise<void>

  // Combat log
  logEntry: (
    sessionId: string,
    characterName: string,
    type: CombatLogType,
    description: string,
    details?: Record<string, unknown>,
    characterId?: string
  ) => Promise<void>
  clearLog: () => Promise<void>

  // Loot
  setLootPool: (items: LootItem[], maxPerPlayer: number) => Promise<void>
  claimLoot: (character: Character, itemName: string) => Promise<void>

  // Shop
  purchaseItem: (character: Character, item: ShopItem) => Promise<'ok' | 'insufficient_gold'>
}

function loadJoinedSessions(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? '{}') } catch { return {} }
}
function saveJoinedSessions(map: Record<string, string>) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(map))
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  playerCharacters: [],
  combatLog: [],
  loading: false,
  error: null,
  joinedSessions: loadJoinedSessions(),
  _sessionChannel: null,
  _playersChannel: null,
  _logChannel: null,

  // ── Load session and player characters ─────────────────────────────────────
  loadSession: async (id) => {
    set({ loading: true, error: null })
    const { data: session, error } = await supabase.from('sessions').select('*').eq('id', id).single()
    if (error || !session) { set({ loading: false, error: error?.message ?? 'Not found' }); return }

    const charIds: string[] = session.player_character_ids ?? []
    let chars: Character[] = []
    if (charIds.length > 0) {
      const { data } = await supabase.from('characters').select('*').in('id', charIds)
      chars = data ?? []
    }

    const { data: log } = await supabase
      .from('combat_log')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    set({ activeSession: session as Session, playerCharacters: chars, combatLog: (log ?? []) as CombatLogEntry[], loading: false })
  },

  // ── Subscribe to realtime (DM) ──────────────────────────────────────────────
  subscribeAll: (sessionId) => {
    get().unsubscribeAll()

    // Session changes
    const sessionCh = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => set({ activeSession: payload.new as Session }))
      .subscribe()

    // Character changes — fetch fresh on any update
    const playersCh = supabase
      .channel(`players:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' },
        async (payload) => {
          const updated = payload.new as Character
          set(s => {
            if (!s.playerCharacters.some(c => c.id === updated.id)) return s
            return { playerCharacters: s.playerCharacters.map(c => c.id === updated.id ? updated : c) }
          })
        })
      .subscribe()

    // Combat log insertions
    const logCh = supabase
      .channel(`log:${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'combat_log', filter: `session_id=eq.${sessionId}` },
        (payload) => set(s => ({ combatLog: [payload.new as CombatLogEntry, ...s.combatLog].slice(0, 200) })))
      .subscribe()

    set({ _sessionChannel: sessionCh, _playersChannel: playersCh, _logChannel: logCh })
  },

  unsubscribeAll: () => {
    const { _sessionChannel, _playersChannel, _logChannel } = get()
    if (_sessionChannel) supabase.removeChannel(_sessionChannel)
    if (_playersChannel) supabase.removeChannel(_playersChannel)
    if (_logChannel) supabase.removeChannel(_logChannel)
    set({ _sessionChannel: null, _playersChannel: null, _logChannel: null })
  },

  // ── Player join/leave ───────────────────────────────────────────────────────
  joinSession: async (code, characterId) => {
    const upperCode = code.toUpperCase().trim()
    const { data: session, error } = await supabase.from('sessions').select('*').eq('id', upperCode).single()
    if (error || !session) return null

    const existing: string[] = session.player_character_ids ?? []
    if (!existing.includes(characterId)) {
      const { error: upErr } = await supabase.from('sessions')
        .update({ player_character_ids: [...existing, characterId] })
        .eq('id', upperCode)
      if (upErr) return null
    }

    const map = { ...get().joinedSessions, [characterId]: upperCode }
    saveJoinedSessions(map)
    set({ joinedSessions: map })
    return upperCode
  },

  leaveSession: async (characterId) => {
    const sessionId = get().joinedSessions[characterId]
    if (!sessionId) return
    const { data: session } = await supabase.from('sessions').select('player_character_ids').eq('id', sessionId).single()
    if (session) {
      await supabase.from('sessions').update({
        player_character_ids: (session.player_character_ids ?? []).filter((id: string) => id !== characterId)
      }).eq('id', sessionId)
    }
    const map = { ...get().joinedSessions }
    delete map[characterId]
    saveJoinedSessions(map)
    set({ joinedSessions: map, activeSession: null })
  },

  getJoinedSession: (characterId) => get().joinedSessions[characterId] ?? null,

  // ── Player subscribes to session (for turn/shop/loot updates) ──────────────
  subscribeToSession: (sessionId, _characterId) => {
    const ch = supabase
      .channel(`player-session:${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload) => set({ activeSession: payload.new as Session }))
      .subscribe()

    supabase.from('sessions').select('*').eq('id', sessionId).single().then(({ data }) => {
      if (data) set({ activeSession: data as Session })
    })

    return () => { supabase.removeChannel(ch) }
  },

  // ── DM patches a player character ──────────────────────────────────────────
  dmPatchCharacter: async (charId, updates) => {
    await supabase.from('characters').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', charId)
    set(s => ({ playerCharacters: s.playerCharacters.map(c => c.id === charId ? { ...c, ...updates } : c) }))
  },

  // ── Patch session ───────────────────────────────────────────────────────────
  patchSession: async (updates) => {
    const { activeSession } = get()
    if (!activeSession) return
    await supabase.from('sessions').update(updates).eq('id', activeSession.id)
    set(s => ({ activeSession: s.activeSession ? { ...s.activeSession, ...updates } : null }))
  },

  setInitiative: async (order) => get().patchSession({ initiative: order, current_turn: 0 }),

  nextTurn: async () => {
    const { activeSession } = get()
    if (!activeSession) return
    const len = activeSession.initiative.length
    if (len === 0) return
    const next = (activeSession.current_turn + 1) % len
    await get().patchSession({ current_turn: next })
  },

  // ── Combat log ─────────────────────────────────────────────────────────────
  logEntry: async (sessionId, characterName, type, description, details = {}, characterId) => {
    await supabase.from('combat_log').insert({
      session_id: sessionId,
      character_id: characterId ?? null,
      character_name: characterName,
      type,
      description,
      details,
    })
  },

  clearLog: async () => {
    const { activeSession } = get()
    if (!activeSession) return
    await supabase.from('combat_log').delete().eq('session_id', activeSession.id)
    set({ combatLog: [] })
  },

  // ── Loot ────────────────────────────────────────────────────────────────────
  setLootPool: async (items, maxPerPlayer) => {
    await get().patchSession({ loot_pool: items, loot_max_per_player: maxPerPlayer, loot_claims: {} })
  },

  claimLoot: async (character, itemName) => {
    const { activeSession } = get()
    if (!activeSession) return

    const claims = { ...(activeSession.loot_claims ?? {}) }
    const existing = claims[character.id] ?? []
    if (existing.includes(itemName)) return
    const maxPer = activeSession.loot_max_per_player ?? 1
    if (existing.length >= maxPer) return

    claims[character.id] = [...existing, itemName]
    await get().patchSession({ loot_claims: claims })

    // Add to character inventory
    const inv = character.inventory ?? []
    const found = inv.find(i => i.name === itemName)
    const newInv = found
      ? inv.map(i => i.name === itemName ? { ...i, quantity: i.quantity + 1 } : i)
      : [...inv, { name: itemName, quantity: 1 }]
    await supabase.from('characters').update({ inventory: newInv, updated_at: new Date().toISOString() }).eq('id', character.id)

    await get().logEntry(activeSession.id, character.name, 'loot', `${character.name} claimed: ${itemName}`, {}, character.id)
  },

  // ── Shop ────────────────────────────────────────────────────────────────────
  purchaseItem: async (character, item) => {
    const { activeSession } = get()
    if (!activeSession) return 'ok'

    const totalGp = (character.gp ?? 0) + (character.pp ?? 0) * 10 + (character.ep ?? 0) * 0.5 + (character.sp ?? 0) * 0.1 + (character.cp ?? 0) * 0.01
    if (totalGp < item.price) return 'insufficient_gold'

    let newGp = character.gp - item.price
    const updates: Partial<Character> = {}
    if (newGp < 0) {
      updates.pp = Math.max(0, character.pp - Math.ceil(Math.abs(newGp) / 10))
      newGp = 0
    }
    updates.gp = Math.max(0, newGp)

    const inv = character.inventory ?? []
    const found = inv.find(i => i.name === item.name)
    updates.inventory = found
      ? inv.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
      : [...inv, { name: item.name, quantity: 1, desc: item.desc }]

    await supabase.from('characters').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', character.id)
    await get().logEntry(activeSession.id, character.name, 'shop', `${character.name} purchased: ${item.name} (${item.price} gp)`, {}, character.id)
    return 'ok'
  },
}))
