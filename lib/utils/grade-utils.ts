// Grade conversion and comparison utilities

import type { Grade } from '../types'

export const GRADE_DISPLAY: Record<Grade, string> = {
  5: '2',
  4: '2A',
  3: '2B',
  2: '3',
  1: '3A',
}

export const GRADE_VALUE: Record<string, Grade> = {
  '2': 5,
  '2A': 4,
  '2B': 3,
  '3': 2,
  '3A': 1,
}

/**
 * Convert internal grade number to display string
 */
export function translateGrade(grade: Grade): string {
  return GRADE_DISPLAY[grade]
}

/**
 * Convert display string to internal grade number
 */
export function reverseTranslateGrade(display: string): Grade {
  return GRADE_VALUE[display] || 1
}

/**
 * Calculate grade difference between two players
 */
export function getGradeDifference(grade1: Grade, grade2: Grade): number {
  return Math.abs(grade1 - grade2)
}

/**
 * Check if grade gap is too large (>1 grade difference)
 */
export function hasLargeGradeGap(grade1: Grade, grade2: Grade): boolean {
  return getGradeDifference(grade1, grade2) > 1
}

/**
 * Calculate team average grade
 */
export function getTeamAverageGrade(players: { grade: Grade }[]): number {
  const sum = players.reduce((acc, p) => acc + p.grade, 0)
  return sum / players.length
}

/**
 * Check if a player is "playing down" (partnered with lower grade)
 */
export function isPlayingDown(playerGrade: Grade, partnerGrade: Grade): boolean {
  return playerGrade > partnerGrade
}
