// Sit-off calculation utilities
// Determines which players need to sit out based on court capacity and divisibility

import type { EventPlayer } from '../types'

export interface SitOffCalculation {
  totalAvailablePlayers: number
  activePlayers: number
  sitOffPlayers: number
  courtsNeeded: number
  courtsAvailable: number
  playersNeededToSitOff: number
  divisibilitySitOffs: number
  capacitySitOffs: number
  isBalanced: boolean
  maleCount: number
  femaleCount: number
}

/**
 * Calculate how many players need to sit off
 */
export function calculateSitOffs(
  players: EventPlayer[],
  courtCount: number
): SitOffCalculation {
  // Filter to available players (not resting)
  const availablePlayers = players.filter(p => !p.isResting)
  
  // Count already sitting off
  const sitOffPlayers = availablePlayers.filter(p => p.so).length
  const activePlayers = availablePlayers.filter(p => !p.so).length
  
  const totalAvailablePlayers = availablePlayers.length
  const maxCourtCapacity = courtCount * 4
  
  // Calculate sit-offs needed for divisibility (groups of 4)
  const divisibilitySitOffs = totalAvailablePlayers % 4
  
  // Calculate sit-offs needed due to court capacity
  const capacitySitOffs = Math.max(0, totalAvailablePlayers - maxCourtCapacity)
  
  // Total sit-offs needed is the larger of the two requirements
  const playersNeededToSitOff = Math.max(divisibilitySitOffs, capacitySitOffs)
  
  // Calculate courts needed
  const playingPlayers = totalAvailablePlayers - playersNeededToSitOff
  const courtsNeeded = Math.floor(playingPlayers / 4)
  
  // Count by gender
  const maleCount = activePlayers.filter(p => p.gender === 'M').length
  const femaleCount = activePlayers.filter(p => p.gender === 'F').length
  
  return {
    totalAvailablePlayers,
    activePlayers,
    sitOffPlayers,
    courtsNeeded,
    courtsAvailable: courtCount,
    playersNeededToSitOff,
    divisibilitySitOffs,
    capacitySitOffs,
    isBalanced: sitOffPlayers === playersNeededToSitOff,
    maleCount,
    femaleCount,
  }
}

/**
 * Auto-select players to sit off based on history and fairness
 * Priority: Players who haven't sat off yet, then by arrival order
 */
export function autoSelectSitOffPlayers(
  players: EventPlayer[],
  playersNeededToSitOff: number,
  setNumber: number
): string[] {
  if (playersNeededToSitOff === 0) return []
  
  // Get available players (not resting, not already sitting off)
  const availablePlayers = players.filter(p => !p.isResting && !p.so)
  
  // Sort by priority:
  // 1. Players who haven't sat off yet (pso = false)
  // 2. Later arrival order (higher number = arrived later)
  const sorted = [...availablePlayers].sort((a, b) => {
    // First priority: those who haven't sat off yet
    if (a.pso !== b.pso) {
      return a.pso ? 1 : -1 // false (not sat off) comes first
    }
    
    // Second priority: later arrivals sit off first
    return (b.arrivalOrder || 0) - (a.arrivalOrder || 0)
  })
  
  // Select the top N players to sit off
  return sorted.slice(0, playersNeededToSitOff).map(p => p.id)
}

/**
 * Get display message for sit-off status
 */
export function getSitOffMessage(calc: SitOffCalculation): string {
  const { courtsAvailable, courtsNeeded, playersNeededToSitOff, maleCount, femaleCount, activePlayers } = calc
  
  let message = `Courts available: ${courtsAvailable}, Courts needed: ${courtsNeeded}, `
  message += `Players to sit off: ${playersNeededToSitOff}\n`
  message += `Total Men: ${maleCount}, Total Women: ${femaleCount}, Total Players: ${activePlayers}`
  
  return message
}

/**
 * Get sit-off status type for styling
 */
export function getSitOffStatus(calc: SitOffCalculation): 'good' | 'warning' | 'error' {
  if (calc.playersNeededToSitOff === 0) return 'good'
  if (calc.isBalanced) return 'good'
  return 'warning'
}
