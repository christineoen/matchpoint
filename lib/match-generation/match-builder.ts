// Core match building logic - Phase 1 & 2
// Handles player sorting and initial match formation by grade

import type { EventPlayer, Match } from '../types'

/**
 * Sort players by strength: grade, then +/- modifier
 * Higher grade = stronger player (5=Grade2, 1=Grade3A)
 */
export function sortPlayersByStrength(players: EventPlayer[]): EventPlayer[] {
  return [...players].sort((a, b) => {
    // First by grade (descending - higher is better)
    if (a.grade !== b.grade) {
      return b.grade - a.grade
    }
    
    // Then by plus/minus modifier
    const modifierOrder: Record<string, number> = { '+': 3, '': 2, '-': 1 }
    const aModifier = modifierOrder[a.plusMinus] || 2
    const bModifier = modifierOrder[b.plusMinus] || 2
    
    return bModifier - aModifier
  })
}

/**
 * Group players by grade
 */
export function groupPlayersByGrade(players: EventPlayer[]): Map<number, EventPlayer[]> {
  const gradeMap = new Map<number, EventPlayer[]>()
  
  for (const player of players) {
    if (!gradeMap.has(player.grade)) {
      gradeMap.set(player.grade, [])
    }
    gradeMap.get(player.grade)!.push(player)
  }
  
  return gradeMap
}

/**
 * Create same-sex matches from a list of same-gender players
 * Returns matches and leftover players
 */
export function createSameSexMatchesFromList(
  players: EventPlayer[],
  format: 'Same-Sex'
): { matches: Omit<Match, 'court'>[]; leftovers: EventPlayer[] } {
  const matches: Omit<Match, 'court'>[] = []
  const leftovers: EventPlayer[] = []
  
  // Take groups of 4 to form matches
  for (let i = 0; i < players.length; i += 4) {
    if (i + 3 < players.length) {
      matches.push({
        team1: [players[i], players[i + 1]],
        team2: [players[i + 2], players[i + 3]],
        format,
        isManual: false,
      })
    } else {
      // Remaining players are leftovers
      leftovers.push(...players.slice(i))
    }
  }
  
  return { matches, leftovers }
}

/**
 * Create mixed doubles matches from equal numbers of men and women
 * Returns matches and leftover players
 */
export function createMixedMatchesFromList(
  men: EventPlayer[],
  women: EventPlayer[],
): { matches: Omit<Match, 'court'>[]; leftoverMen: EventPlayer[]; leftoverWomen: EventPlayer[] } {
  const matches: Omit<Match, 'court'>[] = []
  const minPairs = Math.min(Math.floor(men.length / 2), Math.floor(women.length / 2))
  
  for (let i = 0; i < minPairs; i++) {
    const maleIdx = i * 2
    const femaleIdx = i * 2
    
    matches.push({
      team1: [men[maleIdx], women[femaleIdx]],
      team2: [men[maleIdx + 1], women[femaleIdx + 1]],
      format: 'Mixed',
      isManual: false,
    })
  }
  
  const leftoverMen = men.slice(minPairs * 2)
  const leftoverWomen = women.slice(minPairs * 2)
  
  return { matches, leftoverMen, leftoverWomen }
}

/**
 * Calculate team strength (sum of grades + modifiers)
 */
export function calculateTeamStrength(team: EventPlayer[]): number {
  return team.reduce((sum, player) => {
    let strength = player.grade
    if (player.plusMinus === '+') strength += 0.5
    if (player.plusMinus === '-') strength -= 0.5
    return sum + strength
  }, 0)
}

/**
 * Calculate grade gap within a partnership (team of 2)
 */
export function calculatePartnershipGap(team: EventPlayer[]): number {
  if (team.length !== 2) return 0
  return Math.abs(team[0].grade - team[1].grade)
}
