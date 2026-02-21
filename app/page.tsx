'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Event, Player, Court } from '@/database-types'
import { translateGrade } from '@/lib/utils/grade-utils'

type TabType = 'events' | 'players' | 'courts'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('events')

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['events', 'players', 'courts'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  
  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)
  
  // Players state
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [playerForm, setPlayerForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'M' as 'M' | 'F',
    grade: 3,
    nhc: false,
    plus_minus: '' as '' | '+' | '-',
  })
  
  // Courts state
  const [courts, setCourts] = useState<Court[]>([])
  const [showCourtForm, setShowCourtForm] = useState(false)
  const [courtForm, setCourtForm] = useState({
    name: '',
    surface_type: 'hard' as 'hard' | 'grass',
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    await Promise.all([fetchEvents(), fetchPlayers(), fetchCourts()])
    setLoading(false)
  }

  async function fetchEvents() {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  async function fetchPlayers() {
    try {
      const response = await fetch('/api/players')
      const data = await response.json()
      setPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  async function fetchCourts() {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      setCourts(data.courts || [])
    } catch (error) {
      console.error('Error fetching courts:', error)
    }
  }

  async function createNewEvent() {
    setCreatingEvent(true)
    setEventError(null)
    
    try {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      const timeStr = today.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Tennis Event - ${today.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}`,
          event_date: dateStr,
          start_time: timeStr,
          total_sets: 6,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      const { event } = await response.json()
      router.push(`/events/${event.id}`)
    } catch (err) {
      setEventError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setCreatingEvent(false)
    }
  }

  async function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...playerForm,
          plus_minus: playerForm.plus_minus || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create player')

      setPlayerForm({
        name: '',
        email: '',
        phone: '',
        gender: 'M',
        grade: 3,
        nhc: false,
        plus_minus: '',
      })
      setShowPlayerForm(false)
      fetchPlayers()
    } catch (error) {
      alert('Failed to create player')
    }
  }

  async function handleCourtSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courtForm),
      })

      if (!response.ok) throw new Error('Failed to create court')

      setCourtForm({
        name: '',
        surface_type: 'hard',
      })
      setShowCourtForm(false)
      fetchCourts()
    } catch (error) {
      alert('Failed to create court')
    }
  }

  // CSV Upload handlers
  async function handlePlayersCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      // Skip header row
      const dataLines = lines.slice(1)
      
      const players = dataLines.map(line => {
        const [name, email, phone, gender, grade, nhc, plus_minus] = line.split(',').map(s => s.trim())
        return {
          name,
          email: email || '',
          phone: phone || '',
          gender: gender as 'M' | 'F',
          grade: parseInt(grade),
          nhc: nhc?.toLowerCase() === 'true',
          plus_minus: plus_minus || '',
        }
      }).filter(p => p.name) // Filter out empty rows

      const response = await fetch('/api/players/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players }),
      })

      if (!response.ok) throw new Error('Failed to import players')

      const data = await response.json()
      alert(`Successfully imported ${data.count} players!`)
      fetchPlayers()
    } catch (error) {
      alert('Failed to import players: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    // Reset file input
    e.target.value = ''
  }

  async function handleCourtsCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      
      // Skip header row
      const dataLines = lines.slice(1)
      
      const courts = dataLines.map(line => {
        const [name, surface_type] = line.split(',').map(s => s.trim())
        return {
          name,
          surface_type: surface_type as 'hard' | 'grass',
        }
      }).filter(c => c.name) // Filter out empty rows

      const response = await fetch('/api/courts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courts }),
      })

      if (!response.ok) throw new Error('Failed to import courts')

      const data = await response.json()
      alert(`Successfully imported ${data.count} courts!`)
      fetchCourts()
    } catch (error) {
      alert('Failed to import courts: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    // Reset file input
    e.target.value = ''
  }

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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Events</h1>
              <button
                onClick={createNewEvent}
                disabled={creatingEvent}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
              >
                {creatingEvent ? 'Creating...' : 'Create new event'}
              </button>
            </div>

            {eventError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {eventError}
              </div>
            )}

            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No events yet. Click "Create New Event" to begin!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sets</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => {
                      const eventDate = new Date(event.event_date)
                      const formattedDate = eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })

                      return (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link href={`/events/${event.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition">
                              {event.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{formattedDate}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{event.start_time || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{event.total_sets}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/events/${event.id}`} className="text-primary hover:text-blue-900 font-semibold">
                              View →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS TAB - Content continues in next message due to length */}

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Players</h1>
              <div className="flex gap-3">
                <label className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handlePlayersCSV}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowPlayerForm(!showPlayerForm)}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {showPlayerForm ? 'Cancel' : 'Add player'}
                </button>
              </div>
            </div>

            {/* CSV Format Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>CSV Format:</strong> name,email,phone,gender,grade,nhc,plus_minus
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Example: John Doe,john@email.com,555-1234,M,3,false,+
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Gender: M or F | Grade: 1-5 (1=3A, 2=3, 3=2B, 4=2A, 5=2) | NHC: true or false | Plus/Minus: +, -, or empty
              </p>
            </div>

            {showPlayerForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Add new player</h2>
                <form onSubmit={handlePlayerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" required value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={playerForm.email} onChange={(e) => setPlayerForm({ ...playerForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" value={playerForm.phone} onChange={(e) => setPlayerForm({ ...playerForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select value={playerForm.gender} onChange={(e) => setPlayerForm({ ...playerForm, gender: e.target.value as 'M' | 'F' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                    <select value={playerForm.grade} onChange={(e) => setPlayerForm({ ...playerForm, grade: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value={1}>Grade 3A</option>
                      <option value={2}>Grade 3</option>
                      <option value={3}>Grade 2B</option>
                      <option value={4}>Grade 2A</option>
                      <option value={5}>Grade 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plus/Minus</label>
                    <select value={playerForm.plus_minus} onChange={(e) => setPlayerForm({ ...playerForm, plus_minus: e.target.value as '' | '+' | '-' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">None</option>
                      <option value="+">+</option>
                      <option value="-">-</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="nhc" checked={playerForm.nhc} onChange={(e) => setPlayerForm({ ...playerForm, nhc: e.target.checked })} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                    <label htmlFor="nhc" className="ml-2 text-sm text-gray-700">NHC (New/Hasn't Competed)</label>
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">Add player</button>
                  </div>
                </form>
              </div>
            )}

            {players.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No players yet. Click "Add player" to begin!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {players.map((player) => {
                      const initials = player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      return (
                        <tr key={player.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                                {initials}
                              </div>
                              <Link href={`/players/${player.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition">
                                {player.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-6 py-4"><div className="text-sm text-gray-600">{player.gender === 'M' ? 'Male' : 'Female'}</div></td>
                          <td className="px-6 py-4"><div className="text-sm text-gray-600">{translateGrade(player.grade)}{player.plus_minus}{player.nhc && <span className="ml-2 text-orange-600">NHC</span>}</div></td>
                          <td className="px-6 py-4"><div className="text-sm text-gray-600">{player.email && <div>{player.email}</div>}{player.phone && <div>{player.phone}</div>}{!player.email && !player.phone && '-'}</div></td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${player.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{player.is_active ? 'Active' : 'Inactive'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COURTS TAB */}
        {activeTab === 'courts' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Courts</h1>
              <div className="flex gap-3">
                <label className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold cursor-pointer">
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCourtsCSV}
                    className="hidden"
                  />
                </label>
                <button onClick={() => setShowCourtForm(!showCourtForm)} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">{showCourtForm ? 'Cancel' : 'Add court'}</button>
              </div>
            </div>

            {/* CSV Format Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>CSV Format:</strong> name,surface_type
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Example: Court 1,hard
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Surface Type: hard or grass
              </p>
            </div>

            {showCourtForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Add new court</h2>
                <form onSubmit={handleCourtSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Court Name *</label>
                    <input type="text" required placeholder="e.g., Court 1, Center Court" value={courtForm.name} onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Surface Type *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input type="radio" value="hard" checked={courtForm.surface_type === 'hard'} onChange={(e) => setCourtForm({ ...courtForm, surface_type: e.target.value as 'hard' | 'grass' })} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Hard Court</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" value="grass" checked={courtForm.surface_type === 'grass'} onChange={(e) => setCourtForm({ ...courtForm, surface_type: e.target.value as 'hard' | 'grass' })} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                        <span className="ml-2 text-sm text-gray-700">Grass Court</span>
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">Add court</button>
                </form>
              </div>
            )}

            {courts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No courts yet. Click "Add court" to begin!</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Court Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surface Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courts.map((court) => (
                      <tr key={court.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{court.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              court.surface_type === 'hard' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {court.surface_type === 'hard' ? 'Hard Court' : 'Grass Court'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
