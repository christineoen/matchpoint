// Court-related utilities

import type { Court } from '../types'

/**
 * Check if court name indicates hard court (starts with 'H')
 */
export function isHardCourt(courtName: string): boolean {
  return courtName.toUpperCase().startsWith('H')
}

/**
 * Get court surface type from name
 */
export function getCourtSurface(courtName: string): 'grass' | 'hard' {
  return isHardCourt(courtName) ? 'hard' : 'grass'
}

/**
 * Sort courts by type (grass first) and number
 */
export function sortCourts(courts: string[]): string[] {
  return [...courts].sort((a, b) => {
    const aIsHard = isHardCourt(a)
    const bIsHard = isHardCourt(b)
    
    // Grass courts come first
    if (!aIsHard && bIsHard) return -1
    if (aIsHard && !bIsHard) return 1
    
    // Within same type, sort by number
    const aNum = parseInt(a.replace(/[^0-9]/g, ''))
    const bNum = parseInt(b.replace(/[^0-9]/g, ''))
    return aNum - bNum
  })
}

/**
 * Check if player can play on court (considering NHC preference)
 */
export function canPlayerPlayOnCourt(
  playerNHC: boolean,
  courtName: string
): boolean {
  if (!playerNHC) return true
  return !isHardCourt(courtName)
}

/**
 * Filter courts available for players with NHC preference
 */
export function getAvailableCourtsForPlayers(
  courts: string[],
  players: { nhc: boolean }[]
): string[] {
  const hasNHCPlayer = players.some(p => p.nhc)
  if (!hasNHCPlayer) return courts
  
  return courts.filter(court => !isHardCourt(court))
}
