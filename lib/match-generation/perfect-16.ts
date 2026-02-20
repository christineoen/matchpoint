// Perfect 16 scenario - special algorithm for 16 players of same gender/grade
// Ensures optimal rotation where everyone plays with/against everyone

import type { EventPlayer, Match } from '../types'

/**
 * Get the Perfect 16 schedule for a specific set
 * Returns player indices grouped into matches [p1, p2, p3, p4]
 */
function getPerfect16Schedule(setNumber: number): number[][] | null {
  const schedules: Record<number, number[][]> = {
    1: [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ],
    2: [
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
    ],
    3: [
      [0, 5, 10, 15],
      [1, 4, 11, 14],
      [2, 7, 8, 13],
      [3, 6, 9, 12],
    ],
    4: [
      [0, 6, 11, 13],
      [1, 7, 10, 12],
      [2, 4, 9, 15],
      [3, 5, 8, 14],
    ],
    5: [
      [0, 7, 9, 14],
      [1, 6, 8, 15],
      [2, 5, 11, 12],
      [3, 4, 10, 13],
    ],
  }
  
  return schedules[setNumber] || null
}

/**
 * Check if current scenario qualifies for Perfect 16
 * Requirements:
 * - Exactly 16 players
 * - All same gender
 * - All same grade
 * - No manual matches
 */
export function detectPerfect16Scenario(
  players: EventPlayer[],
  hasManualMatches: boolean
): boolean {
  if (hasManualMatches) return false
  if (players.length !== 16) return false
  
  // Check all same gender
  const genders = new Set(players.map(p => p.gender))
  if (genders.size !== 1) return false
  
  // Check all same grade
  const grades = new Set(players.map(p => p.grade))
  if (grades.size !== 1) return false
  
  return true
}

/**
 * Generate Perfect 16 matches for a specific set
 */
export function generatePerfect16Matches(
  players: EventPlayer[],
  courts: string[],
  setNumber: number
): Match[] | null {
  if (players.length !== 16) return null
  if (courts.length < 4) return null
  
  const schedule = getPerfect16Schedule(setNumber)
  if (!schedule) return null
  
  const matches: Match[] = []
  const gender = players[0].gender
  const format = gender === 'M' 
    ? 'Same-Sex Doubles (Men)' 
    : 'Same-Sex Doubles (Women)'
  
  schedule.forEach((playerIndices, matchIndex) => {
    if (matchIndex >= courts.length) return
    
    const [p1, p2, p3, p4] = playerIndices.map(i => players[i])
    
    matches.push({
      court: courts[matchIndex],
      team1: [p1, p2],
      team2: [p3, p4],
      format,
      isManual: false,
      note: `Perfect 16 Set ${setNumber}`,
    })
  })
  
  return matches
}

/**
 * Check if Perfect 16 is available for the given set number
 */
export function isPerfect16SetAvailable(setNumber: number): boolean {
  return setNumber >= 1 && setNumber <= 5
}
