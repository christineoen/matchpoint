// TypeScript types for Tennis Match-Making Database Schema
// Generated for Next.js + Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'organizer' | 'member'
export type EventStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type Gender = 'M' | 'F'
export type Grade = 1 | 2 | 3 | 4 | 5 // 1=3A, 2=3, 3=2B, 4=2A, 5=2
export type PlusMinus = '+' | '-' | null
export type SurfaceType = 'grass' | 'hard'
export type MatchFormat = 'Same-Sex' | 'Mixed'
export type RelationshipType = 'partner' | 'opponent'
export type Team = 1 | 2

// Grade display mapping
export const GRADE_DISPLAY: Record<Grade, string> = {
  5: '2',
  4: '2A',
  3: '2B',
  2: '3',
  1: '3A',
}

// Reverse mapping for import
export const GRADE_VALUE: Record<string, Grade> = {
  '2': 5,
  '2A': 4,
  '2B': 3,
  '3': 2,
  '3A': 1,
}

// =====================================================
// DATABASE TABLES
// =====================================================

export interface Profile {
  id: string // UUID, references auth.users
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Player {
  id: string // UUID
  user_id: string | null // UUID, references profiles
  name: string
  grade: Grade
  gender: Gender
  nhc: boolean // No Hard Court
  plus_minus: PlusMinus
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string // UUID
  name: string
  event_date: string // ISO date string
  start_time: string | null // HH:MM:SS
  end_time: string | null // HH:MM:SS
  location: string | null
  organizer_id: string | null // UUID, references profiles
  status: EventStatus
  total_sets: number // 1-6
  created_at: string
  updated_at: string
}

export interface Court {
  id: string // UUID
  name: string
  surface_type: SurfaceType
  is_active: boolean
  display_order: number | null
  created_at: string
}

export interface EventCourt {
  id: string // UUID
  event_id: string // UUID
  court_id: string // UUID
  selection_order: number
  is_available: boolean
}

export interface UnavailableSets {
  set1?: boolean
  set2?: boolean
  set3?: boolean
  set4?: boolean
  set5?: boolean
  set6?: boolean
}

export interface EventPlayer {
  id: string // UUID
  event_id: string // UUID
  player_id: string // UUID
  arrival_order: number | null
  is_resting: boolean
  unavailable_sets: UnavailableSets
  created_at: string
}

export interface Match {
  id: string // UUID
  event_id: string // UUID
  court_id: string // UUID
  set_number: number // 1-6
  format: MatchFormat
  is_manual: boolean
  match_order: number | null
  notes: string | null
  created_at: string
}

export interface MatchPlayer {
  id: string // UUID
  match_id: string // UUID
  player_id: string // UUID
  team: Team
  position: number | null // 1 or 2
}

export interface PlayerHistory {
  id: string // UUID
  event_id: string // UUID
  player_id: string // UUID
  other_player_id: string // UUID
  relationship_type: RelationshipType
  set_number: number
  match_id: string | null // UUID
}

export interface SitOut {
  id: string // UUID
  event_id: string // UUID
  player_id: string // UUID
  set_number: number
  is_previous: boolean // PSO flag
}

// =====================================================
// JOINED/EXTENDED TYPES
// =====================================================

export interface PlayerWithUser extends Player {
  profile?: Profile
}

export interface EventWithOrganizer extends Event {
  organizer?: Profile
}

export interface EventCourtWithDetails extends EventCourt {
  court: Court
}

export interface EventPlayerWithDetails extends EventPlayer {
  player: Player
}

export interface MatchWithDetails extends Match {
  court: Court
  event: Event
  players: MatchPlayerWithDetails[]
}

export interface MatchPlayerWithDetails extends MatchPlayer {
  player: Player
}

export interface PlayerHistoryWithDetails extends PlayerHistory {
  player: Player
  other_player: Player
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface MatchDetail {
  match_id: string
  event_id: string
  event_name: string
  event_date: string
  set_number: number
  court_name: string
  surface_type: SurfaceType
  format: MatchFormat
  is_manual: boolean
  match_order: number | null
  notes: string | null
  players: {
    player_id: string
    player_name: string
    grade: Grade
    gender: Gender
    team: Team
    position: number | null
  }[]
}

export interface EventRoster {
  event_id: string
  event_name: string
  event_date: string
  player_id: string
  player_name: string
  grade: Grade
  gender: Gender
  nhc: boolean
  plus_minus: PlusMinus
  arrival_order: number | null
  is_resting: boolean
  unavailable_sets: UnavailableSets
}

// =====================================================
// INPUT/FORM TYPES
// =====================================================

export interface CreatePlayerInput {
  name: string
  grade: Grade
  gender: Gender
  nhc?: boolean
  plus_minus?: PlusMinus
  user_id?: string
}

export interface UpdatePlayerInput {
  name?: string
  grade?: Grade
  gender?: Gender
  nhc?: boolean
  plus_minus?: PlusMinus
  is_active?: boolean
}

export interface CreateEventInput {
  name: string
  event_date: string
  start_time?: string
  end_time?: string
  location?: string
  total_sets?: number
}

export interface UpdateEventInput {
  name?: string
  event_date?: string
  start_time?: string
  end_time?: string
  location?: string
  status?: EventStatus
  total_sets?: number
}

export interface AddEventPlayerInput {
  event_id: string
  player_id: string
  arrival_order?: number
  is_resting?: boolean
  unavailable_sets?: UnavailableSets
}

export interface CreateMatchInput {
  event_id: string
  court_id: string
  set_number: number
  format: MatchFormat
  is_manual?: boolean
  match_order?: number
  notes?: string
  team1_players: string[] // player IDs
  team2_players: string[] // player IDs
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface PlayerForMatching {
  id: string
  name: string
  grade: Grade
  gender: Gender
  nhc: boolean
  plus_minus: PlusMinus
  is_resting: boolean
  unavailable_sets: UnavailableSets
  arrival_order: number
  pso: boolean // Previously Sat Out
  so: boolean // Sitting Out
}

export interface GeneratedMatch {
  court: string
  team1: PlayerForMatching[]
  team2: PlayerForMatching[]
  format: MatchFormat
  isManual?: boolean
  note?: string
}

export interface MatchGenerationInput {
  event_id: string
  set_number: number
  format: MatchFormat
  available_courts: string[]
  players: PlayerForMatching[]
  manual_matches?: GeneratedMatch[]
}

// =====================================================
// SUPABASE DATABASE TYPE
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Player, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      courts: {
        Row: Court
        Insert: Omit<Court, 'id' | 'created_at'>
        Update: Partial<Omit<Court, 'id' | 'created_at'>>
      }
      event_courts: {
        Row: EventCourt
        Insert: Omit<EventCourt, 'id'>
        Update: Partial<Omit<EventCourt, 'id'>>
      }
      event_players: {
        Row: EventPlayer
        Insert: Omit<EventPlayer, 'id' | 'created_at'>
        Update: Partial<Omit<EventPlayer, 'id' | 'created_at'>>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'created_at'>
        Update: Partial<Omit<Match, 'id' | 'created_at'>>
      }
      match_players: {
        Row: MatchPlayer
        Insert: Omit<MatchPlayer, 'id'>
        Update: Partial<Omit<MatchPlayer, 'id'>>
      }
      player_history: {
        Row: PlayerHistory
        Insert: Omit<PlayerHistory, 'id'>
        Update: Partial<Omit<PlayerHistory, 'id'>>
      }
      sit_outs: {
        Row: SitOut
        Insert: Omit<SitOut, 'id'>
        Update: Partial<Omit<SitOut, 'id'>>
      }
    }
    Views: {
      match_details: {
        Row: MatchDetail
      }
      event_roster: {
        Row: EventRoster
      }
    }
    Functions: {
      // Add custom functions here as needed
    }
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function gradeToDisplay(grade: Grade): string {
  return GRADE_DISPLAY[grade]
}

export function displayToGrade(display: string): Grade | null {
  return GRADE_VALUE[display] || null
}

export function isHardCourt(courtName: string): boolean {
  return courtName.toUpperCase().startsWith('H')
}

export function getCourtSurface(courtName: string): SurfaceType {
  return isHardCourt(courtName) ? 'hard' : 'grass'
}

export function isPlayerAvailableForSet(
  player: EventPlayer,
  setNumber: number
): boolean {
  const setKey = `set${setNumber}` as keyof UnavailableSets
  return !player.unavailable_sets[setKey] && !player.is_resting
}

export function formatMatchFormat(format: MatchFormat, gender?: Gender): string {
  if (format === 'Mixed') return 'Mixed Doubles'
  if (gender === 'M') return 'Same-Sex Doubles (Men)'
  if (gender === 'F') return 'Same-Sex Doubles (Women)'
  return 'Same-Sex Doubles'
}
