// Phase 4: Team balancing logic
// Balances teams within matches to reduce point gaps

import type { EventPlayer, Match } from '../types'
import { calculateTeamStrength } from './match-builder'

/**
 * Check if a match would create 2M vs 2W (prohibited)
 */
function isProhibitedGenderMatch(team1: EventPlayer[], team2: EventPlayer[]): boolean {
  const team1Males = team1.filter(p => p.gender === 'M').length
  const team2Males = team2.filter(p => p.gender === 'M').length
  
  return (team1Males === 2 && team2Males === 0) || (team1Males === 0 && team2Males === 2)
}

/**
 * Balance a single match by testing intra-match swaps
 * Only swaps if gap is 2+ points
 */
export function balanceMatch(match: Omit<Match, 'court'>): Omit<Match, 'court'> {
  const team1Strength = calculateTeamStrength(match.team1)
  const team2Strength = calculateTeamStrength(match.team2)
  const currentGap = Math.abs(team1Strength - team2Strength)
  
  // Only balance if gap is 2 or more
  if (currentGap < 2) {
    return match
  }
  
  let bestMatch = match
  let bestGap = currentGap
  
  // Test all possible swaps
  const swapTests = [
    [0, 0], // Team1[0] <-> Team2[0]
    [0, 1], // Team1[0] <-> Team2[1]
    [1, 0], // Team1[1] <-> Team2[0]
  ]
  
  for (const [t1Idx, t2Idx] of swapTests) {
    const newTeam1 = [...match.team1]
    const newTeam2 = [...match.team2]
    
    // Swap
    const temp = newTeam1[t1Idx]
    newTeam1[t1Idx] = newTeam2[t2Idx]
    newTeam2[t2Idx] = temp
    
    // Check if prohibited
    if (isProhibitedGenderMatch(newTeam1, newTeam2)) {
      continue
    }
    
    // Calculate new gap
    const newGap = Math.abs(
      calculateTeamStrength(newTeam1) - calculateTeamStrength(newTeam2)
    )
    
    if (newGap < bestGap) {
      bestGap = newGap
      bestMatch = {
        ...match,
        team1: newTeam1,
        team2: newTeam2,
      }
    }
  }
  
  return bestMatch
}

/**
 * Balance all matches in a set
 */
export function balanceAllMatches(matches: Omit<Match, 'court'>[]): Omit<Match, 'court'>[] {
  return matches.map(match => balanceMatch(match))
}
