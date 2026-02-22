'use client'

import { useEffect, useState, Suspense, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronUp, ChevronDown, Search, Check } from 'lucide-react'
import type { Event, Player, Court } from '@/database-types'
import { translateGrade } from '@/lib/utils/grade-utils'

type TabType = 'events' | 'players' | 'courts'
type SortDirection = 'asc' | 'desc'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('events')

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['events', 'players', 'courts'].includes(tab)) {
      setActiveTab(tab)
    }
    // Reset search boxes when tab changes
    setEventSearchExpanded(false)
    setEventSearchTerm('')
    setPlayerSearchExpanded(false)
    setPlayerSearchTerm('')
    setCourtSearchExpanded(false)
    setCourtSearchTerm('')
  }, [searchParams])
  
  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [eventError, setEventError] = useState<string | null>(null)
  const [eventSortField, setEventSortField] = useState<'name' | 'event_date' | 'start_time' | 'total_sets' | 'player_count' | 'status'>('event_date')
  const [eventSortDirection, setEventSortDirection] = useState<SortDirection>('desc')
  const [eventSearchTerm, setEventSearchTerm] = useState('')
  const [eventSearchExpanded, setEventSearchExpanded] = useState(false)
  const eventSearchRef = useRef<HTMLDivElement>(null)
  
  // Players state
  const [players, setPlayers] = useState<Player[]>([])
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false)
  const [showPlayerCSVModal, setShowPlayerCSVModal] = useState(false)
  const [playerCSVFile, setPlayerCSVFile] = useState<File | null>(null)
  const playerDropdownRef = useRef<HTMLDivElement>(null)
  const [playerSortField, setPlayerSortField] = useState<'name' | 'gender' | 'grade'>('name')
  const [playerSortDirection, setPlayerSortDirection] = useState<SortDirection>('asc')
  const [playerSearchTerm, setPlayerSearchTerm] = useState('')
  const [playerSearchExpanded, setPlayerSearchExpanded] = useState(false)
  const playerSearchRef = useRef<HTMLDivElement>(null)
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
  const [showCourtDropdown, setShowCourtDropdown] = useState(false)
  const [showCourtCSVModal, setShowCourtCSVModal] = useState(false)
  const [courtCSVFile, setCourtCSVFile] = useState<File | null>(null)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [showCourtDrawer, setShowCourtDrawer] = useState(false)
  const [courtEditData, setCourtEditData] = useState<{
    name: string
    number: string
    surface_type: 'hard' | 'grass'
    days: string[]
    status: string
  } | null>(null)
  const courtDropdownRef = useRef<HTMLDivElement>(null)
  const [courtSortField, setCourtSortField] = useState<'name' | 'number' | 'surface_type' | 'availability' | 'status'>('name')
  const [courtSortDirection, setCourtSortDirection] = useState<SortDirection>('asc')
  const [courtSearchTerm, setCourtSearchTerm] = useState('')
  const [courtSearchExpanded, setCourtSearchExpanded] = useState(false)
  const courtSearchRef = useRef<HTMLDivElement>(null)
  const [courtForm, setCourtForm] = useState({
    name: '',
    surface_type: 'hard' as 'hard' | 'grass',
  })
  
  // Store custom court data (names, numbers, days)
  const [courtCustomData, setCourtCustomData] = useState<{
    [courtId: string]: {
      name?: string
      number?: string
      days?: string[]
      status?: string
    }
  }>({})
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (playerDropdownRef.current && !playerDropdownRef.current.contains(event.target as Node)) {
        setShowPlayerDropdown(false)
      }
      if (courtDropdownRef.current && !courtDropdownRef.current.contains(event.target as Node)) {
        setShowCourtDropdown(false)
      }
      if (eventSearchRef.current && !eventSearchRef.current.contains(event.target as Node)) {
        if (eventSearchTerm === '') {
          setEventSearchExpanded(false)
        }
      }
      if (playerSearchRef.current && !playerSearchRef.current.contains(event.target as Node)) {
        if (playerSearchTerm === '') {
          setPlayerSearchExpanded(false)
        }
      }
      if (courtSearchRef.current && !courtSearchRef.current.contains(event.target as Node)) {
        if (courtSearchTerm === '') {
          setCourtSearchExpanded(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [eventSearchTerm, playerSearchTerm, courtSearchTerm])

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
    setPlayerCSVFile(file)
    e.target.value = ''
  }

  async function importPlayersCSV() {
    if (!playerCSVFile) return

    try {
      const text = await playerCSVFile.text()
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
      setShowPlayerCSVModal(false)
      setPlayerCSVFile(null)
    } catch (error) {
      alert('Failed to import players: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  async function handleCourtsCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCourtCSVFile(file)
    e.target.value = ''
  }

  async function importCourtsCSV() {
    if (!courtCSVFile) return

    try {
      const text = await courtCSVFile.text()
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
      setShowCourtCSVModal(false)
      setCourtCSVFile(null)
    } catch (error) {
      alert('Failed to import courts: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Sorting and filtering for events
  const handleEventSort = (field: typeof eventSortField) => {
    if (eventSortField === field) {
      setEventSortDirection(eventSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setEventSortField(field)
      setEventSortDirection('asc')
    }
  }

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const searchLower = eventSearchTerm.toLowerCase()
      return event.name.toLowerCase().includes(searchLower)
    })

    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      // Handle special fields
      if (eventSortField === 'player_count') {
        aVal = (a as any).player_count || 0
        bVal = (b as any).player_count || 0
      } else if (eventSortField === 'status') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const aDate = new Date(a.event_date)
        aDate.setHours(0, 0, 0, 0)
        const bDate = new Date(b.event_date)
        bDate.setHours(0, 0, 0, 0)
        aVal = aDate < today ? 1 : 0 // 1 for completed, 0 for coming up
        bVal = bDate < today ? 1 : 0
      } else {
        aVal = a[eventSortField]
        bVal = b[eventSortField]
      }

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      // Convert to comparable values
      if (eventSortField === 'event_date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return eventSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return eventSortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [events, eventSearchTerm, eventSortField, eventSortDirection])

  const EventSortIcon = ({ field }: { field: typeof eventSortField }) => {
    if (eventSortField !== field) return null
    return eventSortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Sorting and filtering for players
  const handlePlayerSort = (field: typeof playerSortField) => {
    if (playerSortField === field) {
      setPlayerSortDirection(playerSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setPlayerSortField(field)
      setPlayerSortDirection('asc')
    }
  }

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      const searchLower = playerSearchTerm.toLowerCase()
      return player.name.toLowerCase().includes(searchLower) ||
             translateGrade(player.grade).toLowerCase().includes(searchLower)
    })

    filtered.sort((a, b) => {
      let aVal: any = a[playerSortField]
      let bVal: any = b[playerSortField]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return playerSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return playerSortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [players, playerSearchTerm, playerSortField, playerSortDirection])

  const PlayerSortIcon = ({ field }: { field: typeof playerSortField }) => {
    if (playerSortField !== field) return null
    return playerSortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Sorting and filtering for courts
  const handleCourtSort = (field: typeof courtSortField) => {
    if (courtSortField === field) {
      setCourtSortDirection(courtSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setCourtSortField(field)
      setCourtSortDirection('asc')
    }
  }

  const filteredAndSortedCourts = useMemo(() => {
    let filtered = courts.filter(court => {
      const searchLower = courtSearchTerm.toLowerCase()
      return court.name.toLowerCase().includes(searchLower)
    })

    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      if (courtSortField === 'number') {
        const aIndex = courts.indexOf(a)
        const bIndex = courts.indexOf(b)
        const aNum = getCourtNumber(a.id, aIndex)
        const bNum = getCourtNumber(b.id, bIndex)
        // Try to parse as numbers, otherwise compare as strings
        const aNumeric = parseInt(aNum)
        const bNumeric = parseInt(bNum)
        if (!isNaN(aNumeric) && !isNaN(bNumeric)) {
          aVal = aNumeric
          bVal = bNumeric
        } else {
          aVal = aNum.toLowerCase()
          bVal = bNum.toLowerCase()
        }
      } else if (courtSortField === 'name') {
        const aIndex = courts.indexOf(a)
        const bIndex = courts.indexOf(b)
        aVal = getCourtName(a.id, getCourtNumber(a.id, aIndex)).toLowerCase()
        bVal = getCourtName(b.id, getCourtNumber(b.id, bIndex)).toLowerCase()
      } else if (courtSortField === 'availability') {
        aVal = getCourtDaysForId(a.id).length
        bVal = getCourtDaysForId(b.id).length
      } else if (courtSortField === 'status') {
        const statusOrder = { available: 0, maintenance: 1, unavailable: 2 }
        aVal = statusOrder[getCourtStatus(a.id) as keyof typeof statusOrder] ?? 3
        bVal = statusOrder[getCourtStatus(b.id) as keyof typeof statusOrder] ?? 3
      } else {
        aVal = a[courtSortField]
        bVal = b[courtSortField]
      }

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return courtSortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return courtSortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [courts, courtSearchTerm, courtSortField, courtSortDirection, courtCustomData])

  const CourtSortIcon = ({ field }: { field: typeof courtSortField }) => {
    if (courtSortField !== field) return null
    return courtSortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Generate random days for courts (for demo purposes)
  const getCourtDays = (courtId: string) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const seed = courtId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const numDays = (seed % 4) + 3 // 3-6 days
    const selectedDays: string[] = []
    const usedIndices = new Set<number>()
    
    let attempts = 0
    while (selectedDays.length < numDays && attempts < 20) {
      const dayIndex = (seed + attempts * 13) % days.length
      if (!usedIndices.has(dayIndex)) {
        usedIndices.add(dayIndex)
        selectedDays.push(days[dayIndex])
      }
      attempts++
    }
    
    // Sort by day order
    return selectedDays.sort((a, b) => days.indexOf(a) - days.indexOf(b))
  }

  // Generate court number based on court ID
  const getCourtNumber = (courtId: string, index: number) => {
    return courtCustomData[courtId]?.number ?? String(index + 1)
  }

  // Generate realistic court names
  const getCourtName = (courtId: string, courtNumber: number) => {
    if (courtCustomData[courtId]?.name) {
      return courtCustomData[courtId].name
    }
    
    const names = [
      'Center Court',
      'North Court',
      'South Court',
      'East Court',
      'West Court',
      'Championship Court',
      'Stadium Court',
      'Grandstand Court',
      'Court One',
      'Court Two',
      'Court Three',
      'Court Four',
      'Court Five',
      'Court Six',
      'Practice Court A',
      'Practice Court B',
      'Riverside Court',
      'Sunset Court',
      'Garden Court',
      'Pavilion Court'
    ]
    
    return names[courtNumber - 1] || `Court ${courtNumber}`
  }

  // Get court days (custom or generated)
  const getCourtDaysForId = (courtId: string) => {
    if (courtCustomData[courtId]?.days) {
      return courtCustomData[courtId].days!
    }
    return getCourtDays(courtId)
  }

  // Get court status
  const getCourtStatus = (courtId: string) => {
    return courtCustomData[courtId]?.status ?? 'available'
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
            <div className="flex justify-between items-center mb-6 gap-4">
              <h1 className="text-3xl font-bold text-gray-800">Events</h1>
              <div className="flex items-center gap-3">
                <div className="relative" ref={eventSearchRef}>
                  {!eventSearchExpanded ? (
                    <button
                      onClick={() => setEventSearchExpanded(true)}
                      className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        value={eventSearchTerm}
                        onChange={(e) => setEventSearchTerm(e.target.value)}
                        className="w-64 pl-9 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={createNewEvent}
                  disabled={creatingEvent}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold w-44"
                >
                  {creatingEvent ? 'Creating...' : 'Add event'}
                </button>
              </div>
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
            ) : filteredAndSortedEvents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No events match your search.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Event Name
                          <span className={eventSortField === 'name' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="name" />
                            {eventSortField !== 'name' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('event_date')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          <span className={eventSortField === 'event_date' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="event_date" />
                            {eventSortField !== 'event_date' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('start_time')}
                      >
                        <div className="flex items-center gap-2">
                          Time
                          <span className={eventSortField === 'start_time' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="start_time" />
                            {eventSortField !== 'start_time' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('total_sets')}
                      >
                        <div className="flex items-center gap-2">
                          Sets
                          <span className={eventSortField === 'total_sets' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="total_sets" />
                            {eventSortField !== 'total_sets' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('player_count')}
                      >
                        <div className="flex items-center gap-2">
                          Players
                          <span className={eventSortField === 'player_count' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="player_count" />
                            {eventSortField !== 'player_count' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleEventSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          <span className={eventSortField === 'status' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <EventSortIcon field="status" />
                            {eventSortField !== 'status' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedEvents.map((event) => {
                      const eventDate = new Date(event.event_date)
                      const formattedDate = eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const eventDateOnly = new Date(event.event_date)
                      eventDateOnly.setHours(0, 0, 0, 0)
                      const isPast = eventDateOnly < today
                      const status = isPast ? 'Completed' : 'Coming up'
                      const statusColor = isPast ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'

                      return (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link href={`/events/${event.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition underline">
                              {event.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{formattedDate}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {event.start_time ? new Date(`2000-01-01T${event.start_time}`).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              }) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{event.total_sets}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{(event as any).player_count || 0}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {status}
                            </span>
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
            <div className="flex justify-between items-center mb-6 gap-4">
              <h1 className="text-3xl font-bold text-gray-800">Players</h1>
              <div className="flex items-center gap-3">
                <div className="relative" ref={playerSearchRef}>
                  {!playerSearchExpanded ? (
                    <button
                      onClick={() => setPlayerSearchExpanded(true)}
                      className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={playerSearchTerm}
                        onChange={(e) => setPlayerSearchTerm(e.target.value)}
                        className="w-64 pl-9 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
                <div className="relative" ref={playerDropdownRef}>
                  <div className="flex w-44">
                    <button
                      onClick={() => {
                        setShowPlayerForm(!showPlayerForm)
                        setShowPlayerDropdown(false)
                      }}
                      className="bg-primary text-white px-6 py-3 rounded-l-lg hover:bg-blue-700 transition font-semibold flex-1"
                    >
                      {showPlayerForm ? 'Cancel' : 'Add player'}
                    </button>
                    <button
                      onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                      className="bg-primary text-white px-3 py-3 rounded-r-lg hover:bg-blue-700 transition border-l border-blue-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showPlayerDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => {
                          setShowPlayerCSVModal(true)
                          setShowPlayerDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        Upload CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
            ) : filteredAndSortedPlayers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No players match your search.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handlePlayerSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <span className={playerSortField === 'name' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <PlayerSortIcon field="name" />
                            {playerSortField !== 'name' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handlePlayerSort('gender')}
                      >
                        <div className="flex items-center gap-2">
                          Gender
                          <span className={playerSortField === 'gender' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <PlayerSortIcon field="gender" />
                            {playerSortField !== 'gender' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handlePlayerSort('grade')}
                      >
                        <div className="flex items-center gap-2">
                          Grade
                          <span className={playerSortField === 'grade' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <PlayerSortIcon field="grade" />
                            {playerSortField !== 'grade' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedPlayers.map((player) => {
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
            <div className="flex justify-between items-center mb-6 gap-4">
              <h1 className="text-3xl font-bold text-gray-800">Courts</h1>
              <div className="flex items-center gap-3">
                <div className="relative" ref={courtSearchRef}>
                  {!courtSearchExpanded ? (
                    <button
                      onClick={() => setCourtSearchExpanded(true)}
                      className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search courts..."
                        value={courtSearchTerm}
                        onChange={(e) => setCourtSearchTerm(e.target.value)}
                        className="w-64 pl-9 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
                <div className="relative" ref={courtDropdownRef}>
                  <div className="flex w-44">
                    <button
                      onClick={() => {
                        setShowCourtForm(!showCourtForm)
                        setShowCourtDropdown(false)
                      }}
                      className="bg-primary text-white px-6 py-3 rounded-l-lg hover:bg-blue-700 transition font-semibold flex-1"
                    >
                      {showCourtForm ? 'Cancel' : 'Add court'}
                    </button>
                    <button
                      onClick={() => setShowCourtDropdown(!showCourtDropdown)}
                      className="bg-primary text-white px-3 py-3 rounded-r-lg hover:bg-blue-700 transition border-l border-blue-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showCourtDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => {
                          setShowCourtCSVModal(true)
                          setShowCourtDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        Upload CSV
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
            ) : filteredAndSortedCourts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">No courts match your search.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleCourtSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Name
                          <span className={courtSortField === 'name' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <CourtSortIcon field="name" />
                            {courtSortField !== 'name' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleCourtSort('number')}
                      >
                        <div className="flex items-center gap-2">
                          Number
                          <span className={courtSortField === 'number' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <CourtSortIcon field="number" />
                            {courtSortField !== 'number' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleCourtSort('surface_type')}
                      >
                        <div className="flex items-center gap-2">
                          Type
                          <span className={courtSortField === 'surface_type' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <CourtSortIcon field="surface_type" />
                            {courtSortField !== 'surface_type' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleCourtSort('availability')}
                      >
                        <div className="flex items-center gap-2">
                          Availability
                          <span className={courtSortField === 'availability' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <CourtSortIcon field="availability" />
                            {courtSortField !== 'availability' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition select-none group"
                        onClick={() => handleCourtSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Status
                          <span className={courtSortField === 'status' ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}>
                            <CourtSortIcon field="status" />
                            {courtSortField !== 'status' && <ChevronUp className="w-4 h-4 text-gray-400" />}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedCourts.map((court, index) => {
                      const courtNumber = getCourtNumber(court.id, index)
                      const courtName = getCourtName(court.id, courtNumber)
                      const courtDays = getCourtDaysForId(court.id)
                      const courtStatus = getCourtStatus(court.id)
                      
                      return (
                        <tr key={court.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedCourt(court)
                                setCourtEditData({
                                  name: courtName,
                                  number: courtNumber,
                                  surface_type: court.surface_type,
                                  days: courtDays,
                                  status: courtStatus
                                })
                                setShowCourtDrawer(true)
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 underline text-left"
                            >
                              {courtName}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{courtNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {court.surface_type === 'hard' ? 'Hard' : 'Grass'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {courtDays.join(', ')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              courtStatus === 'available' ? 'bg-green-100 text-green-800' :
                              courtStatus === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {courtStatus === 'available' ? 'Available' :
                               courtStatus === 'maintenance' ? 'Maintenance' :
                               'Unavailable'}
                            </span>
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
      </div>

      {/* Player CSV Upload Modal */}
      {showPlayerCSVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Upload players CSV</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>CSV Format:</strong> name,email,phone,gender,grade,nhc,plus_minus
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Example:</strong> John Doe,john@email.com,555-1234,M,3,false,+
              </p>
              <p className="text-xs text-gray-600">
                <strong>Field details:</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-1 ml-4 list-disc">
                <li>Gender: M or F</li>
                <li>Grade: 1-5 (1=3A, 2=3, 3=2B, 4=2A, 5=2)</li>
                <li>NHC: true or false</li>
                <li>Plus/Minus: +, -, or empty</li>
              </ul>
            </div>

            {!playerCSVFile ? (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <p className="text-gray-600 mb-2">Click to select CSV file</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handlePlayersCSV}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>File selected:</strong> {playerCSVFile.name}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPlayerCSVModal(false)
                  setPlayerCSVFile(null)
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={importPlayersCSV}
                disabled={!playerCSVFile}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Import players
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Court CSV Upload Modal */}
      {showCourtCSVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Upload courts CSV</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>CSV Format:</strong> name,surface_type
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Example:</strong> Court 1,hard
              </p>
              <p className="text-xs text-gray-600">
                <strong>Field details:</strong>
              </p>
              <ul className="text-xs text-gray-600 mt-1 ml-4 list-disc">
                <li>Surface Type: hard or grass</li>
              </ul>
            </div>

            {!courtCSVFile ? (
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                  <p className="text-gray-600 mb-2">Click to select CSV file</p>
                  <p className="text-xs text-gray-500">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCourtsCSV}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>File selected:</strong> {courtCSVFile.name}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCourtCSVModal(false)
                  setCourtCSVFile(null)
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={importCourtsCSV}
                disabled={!courtCSVFile}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Import courts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Court Profile Drawer */}
      {showCourtDrawer && selectedCourt && courtEditData && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCourtDrawer(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Court profile</h2>
                <button
                  onClick={() => setShowCourtDrawer(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form className="space-y-5 pb-6" onSubmit={(e) => {
                e.preventDefault()
                // Save changes to courtCustomData
                setCourtCustomData(prev => ({
                  ...prev,
                  [selectedCourt.id]: {
                    name: courtEditData.name,
                    number: courtEditData.number,
                    days: courtEditData.days,
                    status: courtEditData.status
                  }
                }))
                
                // Update the court surface type in the courts array
                setCourts(prev => prev.map(c => 
                  c.id === selectedCourt.id 
                    ? { ...c, surface_type: courtEditData.surface_type }
                    : c
                ))
                
                setShowCourtDrawer(false)
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={courtEditData.name}
                    onChange={(e) => setCourtEditData({ ...courtEditData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                  <input
                    type="text"
                    value={courtEditData.number}
                    onChange={(e) => setCourtEditData({ ...courtEditData, number: e.target.value.slice(0, 5) })}
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={courtEditData.surface_type}
                    onChange={(e) => setCourtEditData({ ...courtEditData, surface_type: e.target.value as 'hard' | 'grass' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="hard">Hard</option>
                    <option value="grass">Grass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={courtEditData.status}
                    onChange={(e) => setCourtEditData({ ...courtEditData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { full: 'Monday', short: 'Mon' },
                      { full: 'Tuesday', short: 'Tue' },
                      { full: 'Wednesday', short: 'Wed' },
                      { full: 'Thursday', short: 'Thu' },
                      { full: 'Friday', short: 'Fri' },
                      { full: 'Saturday', short: 'Sat' },
                      { full: 'Sunday', short: 'Sun' }
                    ].map(day => {
                      const isSelected = courtEditData.days.includes(day.short)
                      return (
                        <button
                          key={day.short}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setCourtEditData({
                                ...courtEditData,
                                days: courtEditData.days.filter(d => d !== day.short)
                              })
                            } else {
                              setCourtEditData({
                                ...courtEditData,
                                days: [...courtEditData.days, day.short].sort((a, b) => {
                                  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                                  return order.indexOf(a) - order.indexOf(b)
                                })
                              })
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {day.short}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="border-t bg-white p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCourtDrawer(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    // Save changes to courtCustomData
                    setCourtCustomData(prev => ({
                      ...prev,
                      [selectedCourt.id]: {
                        name: courtEditData.name,
                        number: courtEditData.number,
                        days: courtEditData.days,
                        status: courtEditData.status
                      }
                    }))
                    
                    // Update the court surface type in the courts array
                    setCourts(prev => prev.map(c => 
                      c.id === selectedCourt.id 
                        ? { ...c, surface_type: courtEditData.surface_type }
                        : c
                    ))
                    
                    setShowCourtDrawer(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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
