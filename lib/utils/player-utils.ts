// Player filtering and sorting utilities

import type { EventPlayer, Gender, MatchFormat } from '../types'

/**
 * Get players available for a specific set
 */
export function getAvailablePlayersForSet(
  players: EventPlayer[],
  setNumber: number
): EventPlayer[] {
  return players.filter(player => {
    // Must have name, grade, and gender
    if (!player.name || !player.grade || !player.gender) return false
    
    // Can't be resting
    if (player.isResting) return false
    
    // Can't be sitting out
    if (player.so) return false
    
    // Check set availability
    const setKey = `set${setNumber}` as keyof EventPlayer['unavailableSets']
    if (player.unavailableSets[setKey]) return false
    
    return true
  })
}

/**
 * Filter players by gender for match format
 */
export function filterPlayersByGender(
  players: EventPlayer[],
  gender: Gender | null
): EventPlayer[] {
  if (!gender) return players
  return players.filter(p => p.gender === gender)
}

/**
 * Sort players by arrival order
 */
export function sortByArrivalOrder(players: EventPlayer[]): EventPlayer[] {
  return [...players].sort((a, b) => a.arrivalOrder - b.arrivalOrder)
}

/**
 * Calculate how many players need to sit out
 */
export function calculateSitOutCount(
  totalPlayers: number,
  availableCourts: number
): number {
  const playersPerMatch = 4
  const playersNeeded = availableCourts * playersPerMatch
  return Math.max(0, totalPlayers - playersNeeded)
}

/**
 * Select players to sit out based on PSO (Previously Sat Out) priority
 */
export function selectPlayersToSitOut(
  players: EventPlayer[],
  count: number
): EventPlayer[] {
  if (count <= 0) return []
  
  // Prioritize players who haven't sat out yet (pso = false)
  const notPreviouslySatOut = players.filter(p => !p.pso)
  const previouslySatOut = players.filter(p => p.pso)
  
  // Sort by arrival order within each group
  const sortedNotPSO = sortByArrivalOrder(notPreviouslySatOut)
  const sortedPSO = sortByArrivalOrder(previouslySatOut)
  
  // Take from non-PSO first, then PSO if needed
  const toSitOut = [...sortedNotPSO, ...sortedPSO].slice(0, count)
  
  return toSitOut
}

/**
 * Split players by gender for same-sex matches
 */
export function splitPlayersByGender(players: EventPlayer[]): {
  male: EventPlayer[]
  female: EventPlayer[]
} {
  return {
    male: players.filter(p => p.gender === 'M'),
    female: players.filter(p => p.gender === 'F'),
  }
}

/**
 * Check if we have enough players for the format
 */
export function hasEnoughPlayers(
  players: EventPlayer[],
  format: MatchFormat,
  courtsCount: number
): { valid: boolean; message?: string } {
  const playersPerMatch = 4
  const totalNeeded = courtsCount * playersPerMatch
  
  if (format === 'Mixed') {
    const { male, female } = splitPlayersByGender(players)
    const maleNeeded = courtsCount * 2
    const femaleNeeded = courtsCount * 2
    
    if (male.length < maleNeeded) {
      return {
        valid: false,
        message: `Need ${maleNeeded} male players, have ${male.length}`,
      }
    }
    if (female.length < femaleNeeded) {
      return {
        valid: false,
        message: `Need ${femaleNeeded} female players, have ${female.length}`,
      }
    }
  } else {
    if (players.length < totalNeeded) {
      return {
        valid: false,
        message: `Need ${totalNeeded} players, have ${players.length}`,
      }
    }
  }
  
  return { valid: true }
}
