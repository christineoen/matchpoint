'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { translateGrade } from '@/lib/utils/grade-utils'

interface Player {
  id: string
  name: string
  grade: number
  gender: 'M' | 'F'
  plus_minus: string
}

interface Match {
  id: string
  court: string
  surface_type: 'grass' | 'hard'
  format: string
  is_manual: boolean
  notes: string | null
  team1: Player[]
  team2: Player[]
}

export default function MatchesPage() {
  const params = useParams()
  const eventId = params.id as string

  const [matchesBySet, setMatchesBySet] = useState<Record<number, Match[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [eventId])

  async function fetchMatches() {
    try {
      const response = await fetch(`/api/events/${eventId}/matches`)
      const data = await response.json()
      setMatchesBySet(data.matchesBySet || {})
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading matches...</p>
          </div>
        </div>
      </main>
    )
  }

  const setNumbers = Object.keys(matchesBySet).map(Number).sort((a, b) => a - b)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/events/${eventId}`}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to Event
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Matches</h1>
        </div>

        {setNumbers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-center">
              No matches generated yet. Go back and generate matches for a set.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {setNumbers.map(setNum => (
              <div key={setNum} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Set {setNum}
                </h2>
                
                <div className="space-y-4">
                  {matchesBySet[setNum].map((match) => (
                    <div
                      key={match.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      {/* Match Layout: Court on left, teams on right */}
                      <div className="flex gap-4">
                        {/* Court Badge */}
                        <div className="flex-shrink-0">
                          <div
                            className={`px-4 py-2 rounded-lg font-bold text-white text-center min-w-[80px] ${
                              match.surface_type === 'hard'
                                ? 'bg-primary'
                                : 'bg-success'
                            }`}
                          >
                            Court<br />{match.court}
                          </div>
                        </div>

                        {/* Teams */}
                        <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                          {/* Team 1 */}
                          <div className="space-y-1">
                            {match.team1.map((player) => (
                              <div
                                key={player.id}
                                className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 flex items-center gap-1.5"
                              >
                                <span className="font-semibold">{player.name}</span>
                                <span className="text-gray-600 font-bold">•</span>
                                <span className="text-sm text-gray-600">{player.gender}</span>
                                <span className="text-gray-600 font-bold">•</span>
                                <span className="text-sm text-gray-600">
                                  {translateGrade(player.grade as 1 | 2 | 3 | 4 | 5)}{player.plus_minus || ''}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* VS */}
                          <div className="text-center text-xl font-bold text-gray-400">
                            VS
                          </div>

                          {/* Team 2 */}
                          <div className="space-y-1">
                            {match.team2.map((player) => (
                              <div
                                key={player.id}
                                className="bg-red-50 border border-red-200 rounded px-3 py-1.5 flex items-center gap-1.5"
                              >
                                <span className="font-semibold">{player.name}</span>
                                <span className="text-gray-600 font-bold">•</span>
                                <span className="text-sm text-gray-600">{player.gender}</span>
                                <span className="text-gray-600 font-bold">•</span>
                                <span className="text-sm text-gray-600">
                                  {translateGrade(player.grade as 1 | 2 | 3 | 4 | 5)}{player.plus_minus || ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes (if any) */}
                      {match.notes && (
                        <div className="mt-2 text-sm text-gray-500 italic ml-[96px]">
                          {match.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
