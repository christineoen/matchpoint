'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, X, ClipboardList, Check } from 'lucide-react'
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

type StepType = 'settings' | 'courts' | 'players' | 'matches'

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [currentStep, setCurrentStep] = useState<StepType>('settings')

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
  const [eventDateInput, setEventDateInput] = useState('')
  const [eventTimeInput, setEventTimeInput] = useState('')
  const [eventName, setEventName] = useState('')
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    fetchEvent()
    fetchAllCourts()
    fetchSelectedCourts()
    fetchAllPlayers()
    fetchEventPlayers()
    fetchMatches()
    
    // Set default date and time to now
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setEventDateInput(dateStr)
    setEventTimeInput(timeStr)
    
    // Set default event name
    const defaultName = `Tennis Event - ${now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`
    setEventName(defaultName)
  }, [eventId])

  async function fetchEvent() {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (!response.ok) throw new Error('Failed to fetch event')
      const data = await response.json()
      setEvent(data.event)
      
      // Set event date and time from fetched event
      if (data.event.event_date) {
        setEventDateInput(data.event.event_date)
      }
      if (data.event.start_time) {
        setEventTimeInput(data.event.start_time)
      }
      if (data.event.name) {
        setEventName(data.event.name)
      }
      if (data.event.total_sets) {
        setCurrentSet(data.event.total_sets)
      }
      
      return data.event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Settings functions
  async function saveSettings() {
    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName,
          event_date: eventDateInput,
          start_time: eventTimeInput,
          total_sets: currentSet,
        }),
      })
      if (!response.ok) throw new Error('Failed to save settings')
      await fetchEvent()
      setSettingsSaved(true)
      setCurrentStep('courts')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
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
      surface_type: court.surface_type as 'grass' | 'hard',
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
      setCurrentStep('players')
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
      gender: player.gender as 'M' | 'F',
      nhc: player.nhc || false,
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

  function randomSelection() {
    // Calculate how many players we need: 4 players per court
    const playersNeeded = selectedCourts.length * 4
    
    if (playersNeeded === 0) {
      alert('Please select courts first')
      return
    }
    
    // Get available players (not already added)
    const availablePlayers = allPlayers.filter(p => !isPlayerAdded(p.id))
    
    if (availablePlayers.length < playersNeeded) {
      alert(`Not enough players available. Need ${playersNeeded} players but only ${availablePlayers.length} available.`)
      return
    }
    
    // Shuffle and select random players
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, playersNeeded)
    
    // Add selected players
    const newPlayers: EventPlayer[] = selected.map((player, index) => ({
      player_id: player.id,
      player_name: player.name,
      grade: player.grade,
      gender: player.gender as 'M' | 'F',
      nhc: player.nhc || false,
      plus_minus: player.plus_minus,
      arrival_order: eventPlayers.length + index + 1,
    }))
    
    setEventPlayers([...eventPlayers, ...newPlayers])
  }

  async function savePlayers() {
    setSaving(true)
    setGenerating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: eventPlayers }),
      })
      if (!response.ok) throw new Error('Failed to save players')
      
      // Refetch event to get the latest total_sets value
      const latestEvent = await fetchEvent()
      
      // After saving players, generate matches for all sets
      const totalSets = latestEvent?.total_sets || 1
      console.log('Generating matches for', totalSets, 'sets (event total_sets:', latestEvent?.total_sets, ')')
      
      for (let setNum = 1; setNum <= totalSets; setNum++) {
        console.log('Generating matches for set', setNum)
        const matchResponse = await fetch(`/api/events/${eventId}/generate-matches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            set_number: setNum,
            format: matchFormat,
          }),
        })
        
        if (!matchResponse.ok) {
          const data = await matchResponse.json()
          throw new Error(data.error || `Failed to generate matches for set ${setNum}`)
        }
        console.log('Successfully generated matches for set', setNum)
      }
      
      // Fetch all the newly generated matches
      const matchesResponse = await fetch(`/api/events/${eventId}/matches`)
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatchesBySet(matchesData.matchesBySet || {})
      }
      
      // Navigate to matches step
      setCurrentStep('matches')
    } catch (error) {
      console.error('Error saving players or generating matches:', error)
      alert(error instanceof Error ? error.message : 'Failed to save players or generate matches')
    } finally {
      setSaving(false)
      setGenerating(false)
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
      await fetchMatches()
    } catch (err) {
      console.error('Error generating matches:', err)
      alert(err instanceof Error ? err.message : 'Failed to generate matches')
    } finally {
      setGenerating(false)
    }
  }

  const availableCourts = allCourts.filter(c => !isCourtSelected(c.id))
  const filteredPlayers = allPlayers.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.name.toLowerCase().includes(search) ||
      translateGrade(p.grade).toLowerCase().includes(search)
    )
  })
  const setNumbers = Object.keys(matchesBySet).map(Number).sort((a, b) => a - b)

  // Step 1 is complete if settings have been saved OR if the event already exists (has name, date, etc.)
  const isSettingsComplete = settingsSaved || (event?.name && event?.event_date && event?.total_sets)
  const isCourtsComplete = selectedCourts.length > 0
  const isPlayersComplete = eventPlayers.length > 0

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
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
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
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-start justify-between max-w-4xl mx-auto relative">
            {/* Settings */}
            <div className="flex flex-col items-center flex-1 relative">
              <button
                onClick={() => setCurrentStep('settings')}
                className={`flex flex-col items-center gap-1 relative z-10 ${currentStep === 'settings' ? '' : 'cursor-pointer hover:opacity-80'}`}
              >
                <div className={`rounded-full flex items-center justify-center font-semibold ${
                  currentStep === 'settings'
                    ? 'w-10 h-10 text-sm border-4 border-indigo-600 bg-indigo-600 text-white shadow-lg'
                    : isSettingsComplete
                    ? 'w-7 h-7 text-xs border-2 border-green-500 bg-green-500 text-white'
                    : 'w-7 h-7 text-xs border-2 border-gray-300 bg-white text-gray-600'
                }`}>
                  {isSettingsComplete && currentStep !== 'settings' ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${currentStep === 'settings' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Game settings
                  </div>
                  <div className="text-xs text-gray-500">{currentSet} set</div>
                </div>
              </button>
            </div>

            {/* Step 2: Courts */}
            <div className="flex flex-col items-center flex-1 relative">
              <button
                onClick={() => isSettingsComplete && setCurrentStep('courts')}
                disabled={!isSettingsComplete}
                className={`flex flex-col items-center gap-1 relative z-10 ${!isSettingsComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              >
                <div className={`rounded-full flex items-center justify-center font-semibold ${
                  currentStep === 'courts'
                    ? 'w-10 h-10 text-sm border-4 border-indigo-600 bg-indigo-600 text-white shadow-lg'
                    : isCourtsComplete
                    ? 'w-7 h-7 text-xs border-2 border-green-500 bg-green-500 text-white'
                    : 'w-7 h-7 text-xs border-2 border-gray-300 bg-white text-gray-600'
                }`}>
                  {isCourtsComplete && currentStep !== 'courts' ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${currentStep === 'courts' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Choose courts
                  </div>
                  <div className="text-xs text-gray-500">{selectedCourts.length} selected</div>
                </div>
              </button>
            </div>

            {/* Step 3: Players */}
            <div className="flex flex-col items-center flex-1 relative">
              <button
                onClick={() => isCourtsComplete && setCurrentStep('players')}
                disabled={!isCourtsComplete}
                className={`flex flex-col items-center gap-1 relative z-10 ${!isCourtsComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              >
                <div className={`rounded-full flex items-center justify-center font-semibold ${
                  currentStep === 'players'
                    ? 'w-10 h-10 text-sm border-4 border-indigo-600 bg-indigo-600 text-white shadow-lg'
                    : isPlayersComplete
                    ? 'w-7 h-7 text-xs border-2 border-green-500 bg-green-500 text-white'
                    : 'w-7 h-7 text-xs border-2 border-gray-300 bg-white text-gray-600'
                }`}>
                  {isPlayersComplete && currentStep !== 'players' ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${currentStep === 'players' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Choose players
                  </div>
                  <div className="text-xs text-gray-500">{eventPlayers.length} selected</div>
                </div>
              </button>
            </div>

            {/* Step 4: Matches */}
            <div className="flex flex-col items-center flex-1 relative">
              <button
                onClick={() => isPlayersComplete && setCurrentStep('matches')}
                disabled={!isPlayersComplete}
                className={`flex flex-col items-center gap-1 relative z-10 ${!isPlayersComplete ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
              >
                <div className={`rounded-full flex items-center justify-center font-semibold ${
                  currentStep === 'matches'
                    ? 'w-10 h-10 text-sm border-4 border-indigo-600 bg-indigo-600 text-white shadow-lg'
                    : 'w-7 h-7 text-xs border-2 border-gray-300 bg-white text-gray-600'
                }`}>
                  4
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${currentStep === 'matches' ? 'text-gray-900' : 'text-gray-700'}`}>
                    Match maker
                  </div>
                  <div className="text-xs text-gray-500">View schedule</div>
                </div>
              </button>
            </div>

            {/* Connecting Lines - Behind circles */}
            <div className="absolute top-3.5 left-0 right-0 flex items-center justify-between px-[12.5%]" style={{zIndex: 0}}>
              <div className="w-7" />
              <div className={`flex-1 h-px ${isSettingsComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="w-7" />
              <div className={`flex-1 h-px ${isCourtsComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="w-7" />
              <div className={`flex-1 h-px ${isPlayersComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="w-7" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm p-6">

          {/* SETTINGS STEP */}
          {currentStep === 'settings' && (
            <div className="max-w-2xl mx-auto pb-24">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Step 1: Game settings</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Event name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., Tennis Event - Jan 15, 2024"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Event date</label>
                    <input
                      type="date"
                      value={eventDateInput}
                      onChange={(e) => setEventDateInput(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Start time</label>
                    <input
                      type="time"
                      value={eventTimeInput}
                      onChange={(e) => setEventTimeInput(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Match format</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setMatchFormat('Same-Sex')}
                        className={`px-4 py-3 border-2 rounded-xl font-medium transition text-lg ${
                          matchFormat === 'Same-Sex'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        Same-Sex
                      </button>
                      <button
                        onClick={() => setMatchFormat('Mixed')}
                        className={`px-4 py-3 border-2 rounded-xl font-medium transition text-lg ${
                          matchFormat === 'Mixed'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        Mixed
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Current set</label>
                    <select
                      value={currentSet}
                      onChange={(e) => setCurrentSet(parseInt(e.target.value))}
                      className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg appearance-none bg-white"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>Set {n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sticky Footer with Continue Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={saving || !eventName || !matchFormat || !currentSet || !eventDateInput || !eventTimeInput}
                    className={`px-8 py-3 rounded-xl font-semibold transition ${
                      saving || !eventName || !matchFormat || !currentSet || !eventDateInput || !eventTimeInput
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COURTS STEP */}
          {currentStep === 'courts' && (
            <div className="pb-24">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Step 2: Choose courts</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Selected courts</h3>
                    {selectedCourts.length > 0 && (
                      <button onClick={() => setSelectedCourts([])} className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Clear all
                      </button>
                    )}
                  </div>
                  {selectedCourts.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                      <Plus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Click courts to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCourts.map((sc) => (
                        <div
                          key={sc.court_id}
                          className={`relative p-4 rounded-xl border-2 transition cursor-pointer hover:shadow-md ${
                            sc.surface_type === 'hard' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                          }`}
                          onClick={() => removeCourt(sc.court_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-900">{sc.court_name}</div>
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                                sc.surface_type === 'hard' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {sc.surface_type}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCourt(sc.court_id)
                              }}
                              className="text-red-600 hover:text-red-700 font-bold w-8 h-8 flex items-center justify-center"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available courts</h3>
                  {availableCourts.length === 0 ? (
                    <p className="text-gray-500 text-center py-12 bg-gray-50 rounded-xl">All courts have been selected</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {availableCourts.map((court) => (
                        <button
                          key={court.id}
                          onClick={() => addCourt(court)}
                          className={`p-6 rounded-xl font-bold text-white text-lg transition hover:scale-105 shadow-md ${
                            court.surface_type === 'hard' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {court.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer with Back and Continue Buttons */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep('settings')}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 transition font-medium no-underline"
                  >
                    Back
                  </button>
                  <button
                    onClick={saveCourts}
                    disabled={selectedCourts.length === 0 || saving}
                    className={`px-8 py-3 rounded-xl font-semibold transition ${
                      selectedCourts.length > 0 && !saving
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PLAYERS STEP */}
          {currentStep === 'players' && (
            <div className="pb-24">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Step 3: Choose players</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Selected players</h3>
                    {eventPlayers.length > 0 && (
                      <button onClick={() => setEventPlayers([])} className="text-sm text-red-600 hover:text-red-700 font-medium">
                        Clear all
                      </button>
                    )}
                  </div>
                  {eventPlayers.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50">
                      <Plus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">Search and click players to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {eventPlayers.map((ep) => (
                        <div
                          key={ep.player_id}
                          className="relative p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-indigo-300 transition cursor-pointer hover:shadow-md"
                          onClick={() => removePlayer(ep.player_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900">{ep.player_name}</div>
                              <div className="flex gap-2 text-sm text-gray-600 mt-1">
                                <span>{translateGrade(ep.grade)}{ep.plus_minus}</span>
                                <span>•</span>
                                <span>{ep.gender === 'M' ? 'Male' : 'Female'}</span>
                                {ep.nhc && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600 font-medium">NHC</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removePlayer(ep.player_id)
                              }}
                              className="text-red-600 hover:text-red-700 font-bold w-8 h-8 flex items-center justify-center"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Available players</h3>
                    <button
                      onClick={randomSelection}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Random selection
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or grade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredPlayers.filter(p => !isPlayerAdded(p.id)).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => addPlayer(player)}
                        className="w-full text-left p-4 rounded-xl transition bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md"
                      >
                        <div className="font-semibold">{player.name}</div>
                        <div className="flex gap-2 text-sm text-gray-600 mt-1">
                          <span>{translateGrade(player.grade)}{player.plus_minus}</span>
                          <span>•</span>
                          <span>{player.gender === 'M' ? 'Male' : 'Female'}</span>
                          {player.nhc && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">NHC</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Footer with Back and Continue Buttons */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep('courts')}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 transition font-medium no-underline"
                  >
                    Back
                  </button>
                  <button
                    onClick={savePlayers}
                    disabled={eventPlayers.length === 0 || saving || generating}
                    className={`px-8 py-3 rounded-xl font-semibold transition ${
                      eventPlayers.length > 0 && !saving && !generating
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {saving || generating ? 'Generating matches...' : 'Make matches →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MATCHES STEP */}
          {currentStep === 'matches' && (
            <div className="pb-24">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Step 4: Review matches</h2>
              </div>

              {Object.keys(matchesBySet).length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-6">No matches generated yet</p>
                  <button
                    onClick={generateMatches}
                    disabled={generating}
                    className={`px-8 py-4 rounded-xl font-semibold text-lg transition ${
                      generating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {generating ? 'Generating...' : '🎾 Generate matches'}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(matchesBySet).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([setNum, matches]) => (
                    <div key={setNum}>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Set {setNum}</h3>
                      <div className="space-y-4">
                        {matches.map((match) => (
                          <div key={match.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                            <div className="flex gap-6">
                              <div className="flex-shrink-0 flex">
                                <div className="px-6 py-3 rounded-xl font-bold text-center min-w-[140px] flex flex-col justify-center bg-green-50 border-2 border-green-200">
                                  <div className="text-sm text-green-700 mb-1">{match.court}</div>
                                  <div className="text-xs text-green-600 capitalize">{match.surface_type}</div>
                                </div>
                              </div>
                              <div className="flex-1 grid grid-cols-3 gap-6 items-center">
                                <div className="space-y-2">
                                  {match.team1.map((player) => {
                                    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`
                                    return (
                                      <div
                                        key={player.id}
                                        className="bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3"
                                      >
                                        <img 
                                          src={avatarUrl} 
                                          alt={player.name}
                                          className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 truncate">{player.name}</div>
                                          <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <span>{player.gender}</span>
                                            <span>•</span>
                                            <span>{translateGrade(player.grade)}{player.plus_minus || ''}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                <div className="text-center text-2xl font-bold text-gray-400">VS</div>
                                <div className="space-y-2">
                                  {match.team2.map((player) => {
                                    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.name)}`
                                    return (
                                      <div
                                        key={player.id}
                                        className="bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3"
                                      >
                                        <img 
                                          src={avatarUrl} 
                                          alt={player.name}
                                          className="w-8 h-8 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-gray-900 truncate">{player.name}</div>
                                          <div className="text-xs text-gray-500 flex items-center gap-1">
                                            <span>{player.gender}</span>
                                            <span>•</span>
                                            <span>{translateGrade(player.grade)}{player.plus_minus || ''}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                            {match.notes && (
                              <div className="mt-4 text-sm text-gray-500 italic ml-[164px]">{match.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sticky Footer with Back, Regenerate, and Save Buttons */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentStep('players')}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 transition font-medium no-underline"
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={generateMatches}
                      disabled={generating}
                      className={`px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold transition no-underline ${
                        generating
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {generating ? 'Regenerating...' : 'Regenerate matches'}
                    </button>
                    <Link
                      href="/"
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold no-underline"
                    >
                      Save and close
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
