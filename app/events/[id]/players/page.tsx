'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Player } from '@/database-types'
import { translateGrade } from '@/lib/utils/grade-utils'

interface EventPlayer {
  player_id: string
  player_name: string
  grade: number
  gender: 'M' | 'F'
  nhc: boolean
  plus_minus: string | null
  arrival_order: number
}

export default function PlayersPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [eventPlayers, setEventPlayers] = useState<EventPlayer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPlayers()
    fetchEventPlayers()
  }, [eventId])

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setAllPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEventPlayers() {
    try {
      const response = await fetch(`/api/events/${eventId}/players`)
      const data = await response.json()
      setEventPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching event players:', error)
    }
  }

  function isPlayerAdded(playerId: string) {
    return eventPlayers.some(ep => ep.player_id === playerId)
  }

  function addPlayer(player: Player) {
    if (isPlayerAdded(player.id)) return

    const newPlayer: EventPlayer = {
      player_id: player.id,
      player_name: player.name,
      grade: player.grade,
      gender: player.gender,
      nhc: player.nhc,
      plus_minus: player.plus_minus,
      arrival_order: eventPlayers.length + 1,
    }

    setEventPlayers([...eventPlayers, newPlayer])
  }

  function removePlayer(playerId: string) {
    const filtered = eventPlayers.filter(ep => ep.player_id !== playerId)
    // Reorder
    const reordered = filtered.map((ep, index) => ({
      ...ep,
      arrival_order: index + 1,
    }))
    setEventPlayers(reordered)
  }

  async function savePlayers() {
    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: eventPlayers }),
      })

      if (!response.ok) throw new Error('Failed to save players')

      router.push(`/events/${eventId}`)
    } catch (error) {
      console.error('Error saving players:', error)
      alert('Failed to save players')
    } finally {
      setSaving(false)
    }
  }

  const filteredPlayers = allPlayers.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(search) ||
      translateGrade(p.grade as 1 | 2 | 3 | 4 | 5).toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading players...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/events/${eventId}`}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to Event
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Manage Players</h1>
          <p className="text-gray-600 mt-1">
            Add players from the member list ({eventPlayers.length} selected)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Players */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Selected Players ({eventPlayers.length})
            </h2>

            {eventPlayers.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Search and click players to add them
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {eventPlayers.map((ep) => (
                  <div
                    key={ep.player_id}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-primary transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {ep.arrival_order}.
                      </span>
                      <div>
                        <span className="font-semibold">{ep.player_name}</span>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <span>Grade {translateGrade(ep.grade as 1 | 2 | 3 | 4 | 5)}</span>
                          <span>•</span>
                          <span>{ep.gender === 'M' ? 'Male' : 'Female'}</span>
                          {ep.nhc && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">NHC</span>
                            </>
                          )}
                          {ep.plus_minus && (
                            <>
                              <span>•</span>
                              <span>{ep.plus_minus}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removePlayer(ep.player_id)}
                      className="text-red-600 hover:text-red-700 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Players */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Member List
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent"
            />

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {filteredPlayers.map((player) => {
                const added = isPlayerAdded(player.id)
                return (
                  <button
                    key={player.id}
                    onClick={() => !added && addPlayer(player)}
                    disabled={added}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      added
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-blue-50 border border-transparent hover:border-primary'
                    }`}
                  >
                    <div className="font-semibold">{player.name}</div>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span>Grade {translateGrade(player.grade as 1 | 2 | 3 | 4 | 5)}</span>
                      <span>•</span>
                      <span>{player.gender === 'M' ? 'Male' : 'Female'}</span>
                      {player.nhc && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600">NHC</span>
                        </>
                      )}
                      {player.plus_minus && (
                        <>
                          <span>•</span>
                          <span>{player.plus_minus}</span>
                        </>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <Link
            href={`/events/${eventId}`}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            onClick={savePlayers}
            disabled={saving || eventPlayers.length === 0}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Players'}
          </button>
        </div>
      </div>
    </main>
  )
}
