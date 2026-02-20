// Same-sex doubles match generation

import type { EventPlayer, Match } from '../types'
import { splitPlayersByGender } from '../utils/player-utils'
import { rotatePlayersForSet, groupIntoTeams, pairTeamsIntoMatches } from './player-rotation'

/**
 * Generate same-sex doubles matches
 * Generates both male and female matches to fill all available courts
 * If not enough players of one gender, fills remaining courts with mixed matches
 */
export function generateSameSexMatches(
  players: EventPlayer[],
  courts: string[],
  setNumber: number
): Match[] {
  console.log('generateSameSexMatches called with:', {
    playerCount: players.length,
    courtCount: courts.length,
    setNumber,
  })
  
  const { male, female } = splitPlayersByGender(players)
  
  console.log('Split by gender:', {
    maleCount: male.length,
    femaleCount: female.length,
  })
  
  const matches: Match[] = []
  let courtIndex = 0
  let usedPlayerIds = new Set<string>()
  
  // Generate male matches first
  if (male.length >= 4) {
    const maleMatches = generateMatchesForGender(male, 'M', setNumber)
    console.log('Male matches generated:', maleMatches.length)
    const courtsForMales = Math.min(maleMatches.length, courts.length - courtIndex)
    
    for (let i = 0; i < courtsForMales; i++) {
      const match = {
        ...maleMatches[i],
        court: courts[courtIndex++],
      }
      matches.push(match)
      // Track used players
      match.team1.forEach(p => usedPlayerIds.add(p.id))
      match.team2.forEach(p => usedPlayerIds.add(p.id))
    }
  }
  
  // Generate female matches
  if (female.length >= 4 && courtIndex < courts.length) {
    const femaleMatches = generateMatchesForGender(female, 'F', setNumber)
    console.log('Female matches generated:', femaleMatches.length)
    const courtsForFemales = Math.min(femaleMatches.length, courts.length - courtIndex)
    
    for (let i = 0; i < courtsForFemales; i++) {
      const match = {
        ...femaleMatches[i],
        court: courts[courtIndex++],
      }
      matches.push(match)
      // Track used players
      match.team1.forEach(p => usedPlayerIds.add(p.id))
      match.team2.forEach(p => usedPlayerIds.add(p.id))
    }
  }
  
  // Fill remaining courts with mixed matches using leftover players
  if (courtIndex < courts.length) {
    const remainingPlayers = players.filter(p => !usedPlayerIds.has(p.id))
    console.log('Remaining players for mixed fill:', remainingPlayers.length)
    
    if (remainingPlayers.length >= 4) {
      // Split remaining players by gender
      const remainingMale = remainingPlayers.filter(p => p.gender === 'M')
      const remainingFemale = remainingPlayers.filter(p => p.gender === 'F')
      
      // Apply rotation to both genders
      const rotatedMale = rotatePlayersForSet(remainingMale, setNumber)
      const rotatedFemale = rotatePlayersForSet(remainingFemale, setNumber)
      
      // Create mixed matches: each team needs 1M + 1F
      let maleIdx = 0
      let femaleIdx = 0
      
      while (courtIndex < courts.length && 
             maleIdx + 1 < rotatedMale.length && 
             femaleIdx + 1 < rotatedFemale.length) {
        matches.push({
          court: courts[courtIndex++],
          team1: [rotatedMale[maleIdx], rotatedFemale[femaleIdx]],
          team2: [rotatedMale[maleIdx + 1], rotatedFemale[femaleIdx + 1]],
          format: 'Same-Sex',
          isManual: false,
        })
        
        maleIdx += 2
        femaleIdx += 2
      }
    }
  }
  
  console.log('Total same-sex matches:', matches.length)
  
  return matches
}

/**
 * Generate matches for a single gender
 */
function generateMatchesForGender(
  players: EventPlayer[],
  gender: 'M' | 'F',
  setNumber: number
): Match[] {
  if (players.length < 4) return []
  
  // Apply rotation for this set
  const rotatedPlayers = rotatePlayersForSet(players, setNumber)
  
  // Group into teams of 2
  const teams = groupIntoTeams(rotatedPlayers)
  
  // Pair teams into matches
  const matchPairs = pairTeamsIntoMatches(teams)
  
  const format = 'Same-Sex'
  
  return matchPairs.map((pair) => ({
    court: '', // Will be assigned later
    team1: pair.team1,
    team2: pair.team2,
    format,
    isManual: false,
  }))
}

/**
 * Generate separate male and female matches if both genders present
 */
export function generateSeparateGenderMatches(
  players: EventPlayer[],
  courts: string[],
  setNumber: number
): Match[] {
  const { male, female } = splitPlayersByGender(players)
  
  const maleMatches = generateSameSexMatches(male, courts, setNumber)
  const femaleMatches = generateSameSexMatches(
    female,
    courts.slice(maleMatches.length),
    setNumber
  )
  
  return [...maleMatches, ...femaleMatches]
}
