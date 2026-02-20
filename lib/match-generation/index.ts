// Main match generation orchestrator

import type { EventPlayer, Match, MatchFormat, MatchGenerationConfig, MatchGenerationResult } from '../types'
import { getAvailablePlayersForSet, splitPlayersByGender } from '../utils/player-utils'
import { sortPlayersByStrength, groupPlayersByGrade, createSameSexMatchesFromList, createMixedMatchesFromList } from './match-builder'
import { balanceAllMatches } from './match-balancer'
import { optimizeCompetitiveness } from './competitiveness-optimizer'

/**
 * Main entry point for match generation
 */
export function generateMatches(config: MatchGenerationConfig): MatchGenerationResult {
  const { players, courts, setNumber, format, manualMatches } = config
  
  const warnings: string[] = []
  const courtNames = courts.map(c => c.name)
  
  // Get available players for this set
  const availablePlayers = getAvailablePlayersForSet(players, setNumber)
  
  // Exclude players in manual matches
  const manualPlayerIds = new Set(
    manualMatches.flatMap(m => [...m.team1, ...m.team2].map(p => p.id))
  )
  const playersForGeneration = availablePlayers.filter(
    p => !manualPlayerIds.has(p.id)
  )
  
  // Check if we have enough players
  if (playersForGeneration.length < 4) {
    return {
      matches: [...manualMatches],
      sitOutPlayers: [],
      warnings: ['Not enough players to generate matches'],
    }
  }
  
  // Generate matches based on format
  let generatedMatches: Omit<Match, 'court'>[]
  
  if (format === 'Mixed') {
    generatedMatches = generateMixedFormat(playersForGeneration, setNumber)
  } else {
    generatedMatches = generateSameSexFormat(playersForGeneration, setNumber)
  }
  
  // Apply balancing and optimization
  console.log('Before balancing:', generatedMatches.length, 'matches')
  generatedMatches = balanceAllMatches(generatedMatches)
  console.log('After balancing, before optimization')
  generatedMatches = optimizeCompetitiveness(generatedMatches)
  console.log('After optimization:', generatedMatches.length, 'matches')
  
  // Assign courts to matches
  // If we have more matches than courts, assign courts cyclically or leave unassigned
  const availableCourts = courtNames.slice(manualMatches.length)
  const finalMatches: Match[] = generatedMatches.map((match, idx) => ({
    ...match,
    court: availableCourts[idx % availableCourts.length] || availableCourts[0] || 'TBD',
  }))
  
  if (generatedMatches.length > availableCourts.length) {
    warnings.push(`Generated ${generatedMatches.length} matches but only ${availableCourts.length} courts available. Courts will be reused.`)
  }
  
  return {
    matches: [...manualMatches, ...finalMatches],
    sitOutPlayers: [], // TODO: Calculate sit-outs
    warnings,
  }
}

/**
 * Generate matches for Same-Sex format
 * Process all males first, then all females, then fill remaining courts with mixed
 */
function generateSameSexFormat(
  players: EventPlayer[],
  setNumber: number
): Omit<Match, 'court'>[] {
  const { male, female } = splitPlayersByGender(players)
  
  // Sort both genders by strength
  const sortedMale = sortPlayersByStrength(male)
  const sortedFemale = sortPlayersByStrength(female)
  
  const matches: Omit<Match, 'court'>[] = []
  
  // Create as many male-only matches as possible
  const maleResult = createSameSexMatchesFromList(sortedMale, 'Same-Sex')
  matches.push(...maleResult.matches)
  
  // Create as many female-only matches as possible
  const femaleResult = createSameSexMatchesFromList(sortedFemale, 'Same-Sex')
  matches.push(...femaleResult.matches)
  
  // Use leftovers to create mixed matches if we have enough
  const leftoverMale = maleResult.leftovers
  const leftoverFemale = femaleResult.leftovers
  
  if (leftoverMale.length >= 2 && leftoverFemale.length >= 2) {
    const mixedResult = createMixedMatchesFromList(leftoverMale, leftoverFemale)
    matches.push(...mixedResult.matches)
  }
  
  return matches
}

/**
 * Generate matches for Mixed format
 * Process grade by grade
 */
function generateMixedFormat(
  players: EventPlayer[],
  setNumber: number
): Omit<Match, 'court'>[] {
  const { male, female } = splitPlayersByGender(players)
  
  // Sort both genders by strength
  const sortedMale = sortPlayersByStrength(male)
  const sortedFemale = sortPlayersByStrength(female)
  
  // Group by grade
  const maleByGrade = groupPlayersByGrade(sortedMale)
  const femaleByGrade = groupPlayersByGrade(sortedFemale)
  
  const matches: Omit<Match, 'court'>[] = []
  const leftoverMale: EventPlayer[] = []
  const leftoverFemale: EventPlayer[] = []
  
  // Process each grade from highest to lowest
  const allGrades = Array.from(new Set([...maleByGrade.keys(), ...femaleByGrade.keys()]))
    .sort((a, b) => b - a)
  
  for (const grade of allGrades) {
    const gradeMale = maleByGrade.get(grade) || []
    const gradeFemale = femaleByGrade.get(grade) || []
    
    // Create mixed matches from this grade
    const result = createMixedMatchesFromList(gradeMale, gradeFemale)
    matches.push(...result.matches)
    leftoverMale.push(...result.leftoverMen)
    leftoverFemale.push(...result.leftoverWomen)
  }
  
  // Handle final leftovers
  if (leftoverMale.length >= 2 && leftoverFemale.length >= 2) {
    const mixedResult = createMixedMatchesFromList(leftoverMale, leftoverFemale)
    matches.push(...mixedResult.matches)
  }
  
  return matches
}

/**
 * Validate match generation configuration
 */
export function validateMatchConfig(config: MatchGenerationConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (config.setNumber < 1 || config.setNumber > 6) {
    errors.push('Set number must be between 1 and 6')
  }
  
  if (config.courts.length === 0) {
    errors.push('At least one court must be selected')
  }
  
  if (config.players.length === 0) {
    errors.push('At least one player must be registered')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

export * from './match-builder'
export * from './match-balancer'
export * from './competitiveness-optimizer'
export * from './same-sex-matches'
export * from './mixed-matches'
export * from './perfect-16'
export * from './player-rotation'

