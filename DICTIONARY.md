SESSION - a live game instance identified by a short code (e.g. "SWORD"), owned by a DM, that players join from their own devices

DM - the Dungeon Master; the user who creates and runs a session

PLAYER - a participant who joins a session with one of their characters

CHARACTER - a player-owned D&D character with stats, spells, inventory, etc.; stored in Supabase and selectable from the player menu

INITIATIVE ORDER - the sorted list of all combatants (players, enemies, and NPCs) during active combat, ordered by initiative roll

ROUND - one full cycle through the initiative order; tracked as combat_round in the session

ENEMY - a hostile creature in the initiative order that dies immediately at 0 HP; no death saves

NPC - a non-player character in the initiative order that gets death saves at 0 HP and can be stabilised, unlike an enemy which simply dies

CONDITIONS - status effects applied to combatants (e.g. Poisoned, Stunned) tracked per-entry in the initiative order

STAGING LIST - the pre-combat holding area where the DM queues creatures before deploying them all at once when combat starts; initiative is auto-rolled on deploy

COMBAT LOG - the timestamped record of all actions taken during a session (HP changes, spells cast, conditions, etc.)

CREATURE DB - the static built-in list of enemies and NPCs that ships with the app (src/data/creatures.ts); read-only, not editable by the DM

CUSTOM CREATURE - a creature the DM created and saved to their account, as opposed to a built-in creature from the creature DB

PRESET ENCOUNTER - a named group of built-in creatures bundled together for quick loading (e.g. "Goblin Ambush"); read-only, ships with the app

CUSTOM ENCOUNTER - a named group of creatures the DM assembled and saved to their account; can be loaded, edited, or deleted

LOOT POOL - the set of items the DM makes available for players to claim after combat

LOOT TEMPLATE - a named, saved loot pool the DM can reload in future sessions

DM DASHBOARD - the main DM screen during a session; contains the Players, Initiative, Log, Loot, Shop, and Notes tabs

PLAYER SHEET - the screen a player sees during a session showing their character's stats and active effects
