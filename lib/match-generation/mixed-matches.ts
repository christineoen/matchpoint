// Mixed doubles match generation

import type { EventPlayer, Match } from '../types'
import { splitPlayersByGender } from '../utils/player-utils'
import { rotatePlayersForSet } from './player-rotation'

/**
 * Generate mixed doubles matches (2M + 2F per match)
 */
export function generateMixedMatches(
  players: EventPlayer[],
  courts: string[],
  setNumber: number
): Match[] {
  const { male, female } = splitPlayersByGender(players)
  
  if (male.length === 0 || female.length === 0) {
    return []
  }
  
  // Apply rotation to both genders
  const rotatedMale = rotatePlayersForSet(male, setNumber)
  const rotatedFemale = rotatePlayersForSet(female, setNumber)
  
  const matches: Match[] = []
  
  // Create matches: each match needs 2 males and 2 females
  for (let i = 0; i < courts.length; i++) {
    const maleIndex1 = i * 2
    const maleIndex2 = i * 2 + 1
    const femaleIndex1 = i * 2
    const femaleIndex2 = i * 2 + 1
    
    // Check if we have enough players
    if (
      maleIndex2 >= rotatedMale.length ||
      femaleIndex2 >= rotatedFemale.length
    ) {
      break
    }
    
    // Team 1: 1 male + 1 female
    // Team 2: 1 male + 1 female
    matches.push({
      court: courts[i],
      team1: [rotatedMale[maleIndex1], rotatedFemale[femaleIndex1]],
      team2: [rotatedMale[maleIndex2], rotatedFemale[femaleIndex2]],
      format: 'Mixed',
      isManual: false,
    })
  }
  
  return matches
}

/**
 * Alternative mixed doubles generation with better gender distribution
 * Ensures males and females are evenly distributed across teams
 */
export function generateBalancedMixedMatches(
  players: EventPlayer[],
  courts: string[],
  setNumber: number
): Match[] {
  const { male, female } = splitPlayersByGender(players)
  
  if (male.length < 2 || female.length < 2) {
    return []
  }
  
  // Apply rotation
  const rotatedMale = rotatePlayersForSet(male, setNumber)
  const rotatedFemale = rotatePlayersForSet(female, setNumber)
  
  const matches: Match[] = []
  let maleIdx = 0
  let femaleIdx = 0
  
  for (let i = 0; i < courts.length; i++) {
    // Need 2 males and 2 females per match
    if (maleIdx + 1 >= rotatedMale.length || femaleIdx + 1 >= rotatedFemale.length) {
      break
    }
    
    matches.push({
      court: courts[i],
      team1: [rotatedMale[maleIdx], rotatedFemale[femaleIdx]],
      team2: [rotatedMale[maleIdx + 1], rotatedFemale[femaleIdx + 1]],
      format: 'Mixed',
      isManual: false,
    })
    
    maleIdx += 2
    femaleIdx += 2
  }
  
  return matches
}
