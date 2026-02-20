// Player rotation algorithms
// Based on the AB-smart mixing strategy from the original code

import type { EventPlayer } from '../types'

/**
 * Split array into two halves (A and B groups)
 */
function splitAB<T>(arr: T[]): [T[], T[]] {
  const midpoint = Math.ceil(arr.length / 2)
  return [arr.slice(0, midpoint), arr.slice(midpoint)]
}

/**
 * Rotate array right by n positions
 */
function rotateRight<T>(arr: T[], positions: number): T[] {
  const len = arr.length
  if (len === 0) return [...arr]
  
  const n = ((positions % len) + len) % len
  if (n === 0) return [...arr]
  
  return [...arr.slice(len - n), ...arr.slice(0, len - n)]
}

/**
 * Interleave two arrays (alternating elements)
 */
function interleaveAB<T>(arrA: T[], arrB: T[]): T[] {
  const result: T[] = []
  const maxLen = Math.max(arrA.length, arrB.length)
  
  for (let i = 0; i < maxLen; i++) {
    if (i < arrA.length) result.push(arrA[i])
    if (i < arrB.length) result.push(arrB[i])
  }
  
  return result
}

/**
 * AB-Smart mixing algorithm for player rotation
 * Ensures players get different partners/opponents across sets
 * 
 * @param players - Array of players to rotate
 * @param setNumber - Current set number (1-6)
 * @returns Rotated player array
 */
export function mixABSmart<T>(players: T[], setNumber: number): T[] {
  if (players.length <= 1) return [...players]
  
  let [groupA, groupB] = splitAB(players)
  
  // Rotation amounts based on set number
  const rotationA = setNumber - 1
  const rotationB = 2 * (setNumber - 1)
  
  groupA = rotateRight(groupA, rotationA)
  groupB = rotateRight(groupB, rotationB)
  
  return interleaveAB(groupA, groupB)
}

/**
 * Apply rotation to players for a specific set
 */
export function rotatePlayersForSet(
  players: EventPlayer[],
  setNumber: number
): EventPlayer[] {
  return mixABSmart(players, setNumber)
}

/**
 * Group players into teams of 2
 */
export function groupIntoTeams(players: EventPlayer[]): EventPlayer[][] {
  const teams: EventPlayer[][] = []
  
  for (let i = 0; i < players.length; i += 2) {
    if (i + 1 < players.length) {
      teams.push([players[i], players[i + 1]])
    }
  }
  
  return teams
}

/**
 * Create matches from grouped teams
 * Takes teams in pairs to create matches (team1 vs team2)
 */
export function pairTeamsIntoMatches(
  teams: EventPlayer[][]
): Array<{ team1: EventPlayer[]; team2: EventPlayer[] }> {
  const matches: Array<{ team1: EventPlayer[]; team2: EventPlayer[] }> = []
  
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      matches.push({
        team1: teams[i],
        team2: teams[i + 1],
      })
    }
  }
  
  return matches
}
