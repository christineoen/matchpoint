// Type helpers for Supabase nested queries
// These provide proper typing for common query patterns

import type { Database } from '@/database-types'

type Tables = Database['public']['Tables']

// =====================================================
// NESTED QUERY TYPES
// =====================================================

// Event courts with court details
export type EventCourtWithCourt = Tables['event_courts']['Row'] & {
  court: Tables['courts']['Row']
}

// Event players with player details
export type EventPlayerWithPlayer = Tables['event_players']['Row'] & {
  player: Tables['players']['Row']
}

// Matches with all relations
export type MatchWithRelations = Tables['matches']['Row'] & {
  court: Tables['courts']['Row']
  match_players: Array<
    Tables['match_players']['Row'] & {
      player: Tables['players']['Row']
    }
  >
}

// Match player with player details
export type MatchPlayerWithPlayer = Tables['match_players']['Row'] & {
  player: Tables['players']['Row']
}

// =====================================================
// INSERT/UPDATE TYPES
// =====================================================

export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type PlayerInsert = Database['public']['Tables']['players']['Insert']
export type PlayerUpdate = Database['public']['Tables']['players']['Update']

export type MatchInsert = Database['public']['Tables']['matches']['Insert']
export type MatchPlayerInsert = Database['public']['Tables']['match_players']['Insert']

export type EventCourtInsert = Database['public']['Tables']['event_courts']['Insert']
export type EventPlayerInsert = Database['public']['Tables']['event_players']['Insert']

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface EventCourtsResponse {
  courts: Array<{
    court_id: string
    court_name: string
    surface_type: 'grass' | 'hard'
    selection_order: number
  }>
}

export interface EventPlayersResponse {
  players: Array<{
    player_id: string
    player_name: string
    grade: number
    gender: 'M' | 'F'
    nhc: boolean
    plus_minus: '+' | '-' | null
    arrival_order: number | null
  }>
}

export interface MatchesBySetResponse {
  matchesBySet: Record<number, Array<{
    id: string
    court: string
    surface_type: 'grass' | 'hard'
    format: string
    is_manual: boolean
    notes: string | null
    team1: Array<{
      id: string
      name: string
      grade: number
      gender: 'M' | 'F'
      plus_minus: '+' | '-' | null
    }>
    team2: Array<{
      id: string
      name: string
      grade: number
      gender: 'M' | 'F'
      plus_minus: '+' | '-' | null
    }>
  }>>
}
