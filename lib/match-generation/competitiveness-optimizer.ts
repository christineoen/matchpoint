// Phase 5: Competitiveness optimization
// Fixes uncompetitive matches (partnerships with 2+ grade gap)

import type { EventPlayer, Match } from '../types'
import { calculatePartnershipGap } from './match-builder'

/**
 * Check if a match is uncompetitive (either partnership has 2+ grade gap)
 */
export function isUncompetitiveMatch(match: Omit<Match, 'court'>): boolean {
  const team1Gap = calculatePartnershipGap(match.team1)
  const team2Gap = calculatePartnershipGap(match.team2)
  
  return team1Gap >= 2 || team2Gap >= 2
}

/**
 * Optimize competitiveness by swapping players between uncompetitive matches
 * Takes 2 weakest from one match, 2 strongest from another
 * Also handles single uncompetitive matches with intra-match swaps
 */
export function optimizeCompetitiveness(
  matches: Omit<Match, 'court'>[]
): Omit<Match, 'court'>[] {
  const result = [...matches]
  const uncompetitiveIndices: number[] = []
  
  // Find all uncompetitive matches
  for (let i = 0; i < result.length; i++) {
    if (isUncompetitiveMatch(result[i])) {
      uncompetitiveIndices.push(i)
    }
  }
  
  // Process pairs of uncompetitive matches
  for (let i = 0; i < uncompetitiveIndices.length - 1; i += 2) {
    const idx1 = uncompetitiveIndices[i]
    const idx2 = uncompetitiveIndices[i + 1]
    
    const match1 = result[idx1]
    const match2 = result[idx2]
    
    // Get all players from both matches
    const allPlayers = [
      ...match1.team1,
      ...match1.team2,
      ...match2.team1,
      ...match2.team2,
    ]
    
    // Sort by strength
    allPlayers.sort((a, b) => {
      if (a.grade !== b.grade) return b.grade - a.grade
      const modOrder: Record<string, number> = { '+': 3, '': 2, '-': 1 }
      return (modOrder[b.plusMinus] || 2) - (modOrder[a.plusMinus] || 2)
    })
    
    // Redistribute: strongest 4 in one match, weakest 4 in other
    result[idx1] = {
      ...match1,
      team1: [allPlayers[0], allPlayers[1]],
      team2: [allPlayers[2], allPlayers[3]],
    }
    
    result[idx2] = {
      ...match2,
      team1: [allPlayers[4], allPlayers[5]],
      team2: [allPlayers[6], allPlayers[7]],
    }
  }
  
  // Handle single uncompetitive match (if odd number)
  if (uncompetitiveIndices.length % 2 === 1) {
    const idx = uncompetitiveIndices[uncompetitiveIndices.length - 1]
    result[idx] = fixSingleUncompetitiveMatch(result[idx])
  }
  
  return result
}

/**
 * Fix a single uncompetitive match by swapping players within the match
 * Goal: Create more balanced partnerships (reduce grade gaps)
 */
function fixSingleUncompetitiveMatch(match: Omit<Match, 'court'>): Omit<Match, 'court'> {
  const allPlayers = [...match.team1, ...match.team2]
  
  // Sort by strength
  allPlayers.sort((a, b) => {
    if (a.grade !== b.grade) return b.grade - a.grade
    const modOrder: Record<string, number> = { '+': 3, '': 2, '-': 1 }
    return (modOrder[b.plusMinus] || 2) - (modOrder[a.plusMinus] || 2)
  })
  
  // Create balanced partnerships: strongest with weakest
  // Team 1: 1st strongest + 4th strongest
  // Team 2: 2nd strongest + 3rd strongest
  return {
    ...match,
    team1: [allPlayers[0], allPlayers[3]],
    team2: [allPlayers[1], allPlayers[2]],
  }
}
