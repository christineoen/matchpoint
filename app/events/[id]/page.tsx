'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Event, Court, Player } from '@/database-types'
import { translateGrade } from '@/lib/utils/grade-utils'

interface SelectedCourt {
  court_id: string
  court_name: string
  surface_type: 'grass' | 'hard'
  selection_order: number
}

interface EventPlayer {
  player_id: string
  player_name: string
  grade: number
  gender: 'M' | 'F'
  nhc: boolean
  plus_minus: string | null
  arrival_order: number
}

interface MatchPlayer {
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
  team1: MatchPlayer[]
  team2: MatchPlayer[]
}

type TabType = 'courts' | 'players' | 'matches'

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('courts')

  // Courts state
  const [allCourts, setAllCourts] = useState<Court[]>([])
  const [selectedCourts, setSelectedCourts] = useState<SelectedCourt[]>([])
  
  // Players state
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [eventPlayers, setEventPlayers] = useState<EventPlayer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Matches state
  const [matchesBySet, setMatchesBySet] = useState<Record<number, Match[]>>({})
  const [matchFormat, setMatchFormat] = useState<'Same-Sex' | 'Mixed'>('Same-Sex')
  const [currentSet, setCurrentSet] = useState(1)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()
    fetchAllCourts()
    fetchSelectedCourts()
    fetchAllPlayers()
    fetchEventPlayers()
    fetchMatches()
  }, [eventId])

  async function fetchEvent() {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event')
      const data = await response.json()
      setEvent(data.event)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Courts functions
  async function fetchAllCourts() {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      setAllCourts(data.courts || [])
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
  }

  async function fetchSelectedCourts() {
    try {
      const response = await fetch(`/api/events/${eventId}/courts`)
      const data = await response.json()
      setSelectedCourts(data.courts || [])
    } catch (error) {
      console.error('Error fetching selected courts:', error)
    }
  }

  function isCourtSelected(courtId: string) {
    return selectedCourts.some(sc => sc.court_id === courtId)
  }

  function addCourt(court: Court) {
    if (isCourtSelected(court.id)) return
    const newSelection: SelectedCourt = {
      court_id: court.id,
      court_name: court.name,
      surface_type: court.surface_type,
      selection_order: selectedCourts.length + 1,
    }
    setSelectedCourts([...selectedCourts, newSelection])
  }

  function removeCourt(courtId: string) {
    const filtered = selectedCourts.filter(sc => sc.court_id !== courtId)
    const reordered = filtered.map((sc, index) => ({
      ...sc,
      selection_order: index + 1,
    }))
    setSelectedCourts(reordered)
  }

  async function saveCourts() {
    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}/courts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courts: selectedCourts }),
      })
      if (!response.ok) throw new Error('Failed to save courts')
      alert('Courts saved successfully!')
    } catch (error) {
      console.error('Error saving courts:', error)
      alert('Failed to save courts')
    } finally {
      setSaving(false)
    }
  }

  // Players functions
  async function fetchAllPlayers() {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setAllPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching players:', error)
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
      alert('Players saved successfully!')
    } catch (error) {
      console.error('Error saving players:', error)
      alert('Failed to save players')
    } finally {
      setSaving(false)
    }
  }

  // Matches functions
  async function fetchMatches() {
    try {
      const response = await fetch(`/api/events/${eventId}/matches`)
      const data = await response.json()
      setMatchesBySet(data.matchesBySet || {})
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  async function generateMatches() {
    setGenerating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/generate-matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set_number: currentSet,
          format: matchFormat,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate matches')
      }
      const data = await response.json()
      console.log('Generated matches:', data)
      await fetchMatches()
      setActiveTab('matches')
    } catch (err) {
      console.error('Error generating matches:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate matches')
    } finally {
      setGenerating(false)
    }
  }

  const canGenerateMatches = selectedCourts.length > 0 && eventPlayers.length > 0
  const availableCourts = allCourts.filter(c => !isCourtSelected(c.id))
  const filteredPlayers = allPlayers.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(search) ||
      translateGrade(p.grade as 1 | 2 | 3 | 4 | 5).toLowerCase().includes(search)
    )
  })
  const setNumbers = Object.keys(matchesBySet).map(Number).sort((a, b) => a - b)

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error || 'Event not found'}
          </div>
          <Link href="/events" className="text-primary hover:underline mt-4 inline-block">
            ← Back to Events
          </Link>
        </div>
      </main>
    )
  }

  const eventDate = new Date(event.event_date)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/events" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Events
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
              <p className="text-gray-600 mt-1">{formattedDate}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              event.status === 'active' ? 'bg-green-100 text-green-700' :
              event.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Match Generation Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Match Format</label>
                <div className="flex gap-2">
                  <button onClick={() => setMatchFormat('Same-Sex')} className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                    matchFormat === 'Same-Sex' ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-primary'
                  }`}>Same-Sex</button>
                  <button onClick={() => setMatchFormat('Mixed')} className={`px-4 py-2 border-2 rounded-lg font-medium transition ${
                    matchFormat === 'Mixed' ? 'border-primary bg-primary text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-primary'
                  }`}>Mixed</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Set</label>
                <select value={currentSet} onChange={(e) => setCurrentSet(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>Set {n}</option>)}
                </select>
              </div>
            </div>
            <button onClick={generateMatches} disabled={!canGenerateMatches || generating}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                canGenerateMatches && !generating ? 'bg-success text-white hover:bg-green-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}>
              {generating ? 'Generating...' : 'Generate Matches'}
            </button>
          </div>
          {!canGenerateMatches && <p className="text-sm text-gray-500 mt-3">Select courts and add players first</p>}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button onClick={() => setActiveTab('courts')} className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'courts' ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}>
                Courts {selectedCourts.length > 0 && <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">{selectedCourts.length}</span>}
              </button>
              <button onClick={() => setActiveTab('players')} className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'players' ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}>
                Players {eventPlayers.length > 0 && <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">{eventPlayers.length}</span>}
              </button>
              <button onClick={() => setActiveTab('matches')} className={`px-6 py-4 font-medium border-b-2 transition ${
                activeTab === 'matches' ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}>
                Matches
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* COURTS TAB */}
            {activeTab === 'courts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Selected Courts ({selectedCourts.length})</h2>
                    {selectedCourts.length > 0 && (
                      <button onClick={() => setSelectedCourts([])} className="text-sm text-red-600 hover:text-red-700">Clear All</button>
                    )}
                  </div>
                  {selectedCourts.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500">Click courts below to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCourts.map((sc) => (
                        <div key={sc.court_id} className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          sc.surface_type === 'hard' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 w-6">{sc.selection_order}.</span>
                            <span className="font-bold text-lg">{sc.court_name}</span>
                            <span className="text-xs px-2 py-1 rounded bg-white">{sc.surface_type}</span>
                          </div>
                          <button onClick={() => removeCourt(sc.court_id)} className="text-red-600 hover:text-red-700 font-bold text-xl">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedCourts.length > 0 && (
                    <button onClick={saveCourts} disabled={saving} className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Courts'}
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4">Available Courts</h2>
                  {availableCourts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">All courts selected</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableCourts.map((court) => (
                        <button key={court.id} onClick={() => addCourt(court)} className={`p-4 rounded-lg font-bold text-white text-lg transition hover:scale-105 ${
                          court.surface_type === 'hard' ? 'bg-primary hover:bg-blue-700' : 'bg-success hover:bg-green-600'
                        }`}>{court.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PLAYERS TAB */}
            {activeTab === 'players' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Selected Players ({eventPlayers.length})</h2>
                  {eventPlayers.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <p className="text-gray-500">Search and click players to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {eventPlayers.map((ep) => (
                        <div key={ep.player_id} className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-primary transition">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 w-6">{ep.arrival_order}.</span>
                            <div>
                              <span className="font-semibold">{ep.player_name}</span>
                              <div className="flex gap-2 text-sm text-gray-600">
                                <span>Grade {translateGrade(ep.grade)}</span>
                                <span>•</span>
                                <span>{ep.gender === 'M' ? 'Male' : 'Female'}</span>
                                {ep.nhc && <><span>•</span><span className="text-orange-600">NHC</span></>}
                                {ep.plus_minus && <><span>•</span><span>{ep.plus_minus}</span></>}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removePlayer(ep.player_id)} className="text-red-600 hover:text-red-700 font-bold text-xl">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {eventPlayers.length > 0 && (
                    <button onClick={savePlayers} disabled={saving} className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Players'}
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-4">Member List</h2>
                  <input type="text" placeholder="Search by name or grade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent" />
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {filteredPlayers.map((player) => {
                      const added = isPlayerAdded(player.id)
                      return (
                        <button key={player.id} onClick={() => !added && addPlayer(player)} disabled={added}
                          className={`w-full text-left p-3 rounded-lg transition ${
                            added ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-blue-50 border border-transparent hover:border-primary'
                          }`}>
                          <div className="font-semibold">{player.name}</div>
                          <div className="flex gap-2 text-sm text-gray-600">
                            <span>Grade {translateGrade(player.grade as 1 | 2 | 3 | 4 | 5)}</span>
                            <span>•</span>
                            <span>{player.gender === 'M' ? 'Male' : 'Female'}</span>
                            {player.nhc && <><span>•</span><span className="text-orange-600">NHC</span></>}
                            {player.plus_minus && <><span>•</span><span>{player.plus_minus}</span></>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MATCHES TAB */}
            {activeTab === 'matches' && (
              <div>
                {setNumbers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No matches generated yet. Click "Generate Matches" above to create matches for the selected set.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {setNumbers.map(setNum => (
                      <div key={setNum}>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Set {setNum}</h2>
                        <div className="space-y-4">
                          {matchesBySet[setNum].map((match) => (
                            <div key={match.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className={`px-4 py-2 rounded-lg font-bold text-white text-center min-w-[80px] ${
                                    match.surface_type === 'hard' ? 'bg-primary' : 'bg-success'
                                  }`}>Court<br />{match.court}</div>
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                                  <div className="space-y-1">
                                    {match.team1.map((player) => (
                                      <div key={player.id} className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 flex items-center gap-1.5">
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
                                  <div className="text-center text-xl font-bold text-gray-400">VS</div>
                                  <div className="space-y-1">
                                    {match.team2.map((player) => (
                                      <div key={player.id} className="bg-red-50 border border-red-200 rounded px-3 py-1.5 flex items-center gap-1.5">
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
                              {match.notes && <div className="mt-2 text-sm text-gray-500 italic ml-[96px]">{match.notes}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
