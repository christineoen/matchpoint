// Core types for match-making logic
// Simplified from the original HTML/JS implementation

export type Gender = 'M' | 'F'
export type Grade = 1 | 2 | 3 | 4 | 5 // 1=3A, 2=3, 3=2B, 4=2A, 5=2
export type MatchFormat = 'Same-Sex' | 'Mixed'

export interface Player {
  id: string
  name: string
  grade: Grade
  gender: Gender
  nhc: boolean // No Hard Court
  plusMinus: '+' | '-' | ''
  arrivalOrder: number
}

export interface EventPlayer extends Player {
  isResting: boolean
  unavailableSets: {
    set1: boolean
    set2: boolean
    set3: boolean
    set4: boolean
    set5: boolean
    set6: boolean
  }
  pso: boolean // Previously Sat Out
  so: boolean // Sitting Out (current set)
}

export interface Court {
  name: string
  surfaceType: 'grass' | 'hard'
}

export interface Match {
  court: string
  team1: EventPlayer[]
  team2: EventPlayer[]
  format: string
  isManual: boolean
  note?: string
}

export interface MatchGenerationConfig {
  players: EventPlayer[]
  courts: Court[]
  setNumber: number
  format: MatchFormat
  manualMatches: Match[]
}

export interface MatchGenerationResult {
  matches: Match[]
  sitOutPlayers: EventPlayer[]
  warnings: string[]
}
