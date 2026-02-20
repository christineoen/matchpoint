'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Event } from '@/database-types'

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createNewSession() {
    setCreating(true)
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
          name: `Tennis Session - ${today.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          })}`,
          event_date: dateStr,
          start_time: timeStr,
          total_sets: 6,
        }),
      })

      if (!response.ok) throw new Error('Failed to create session')

      const { event } = await response.json()
      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tennis Sessions</h1>
            <p className="text-gray-600 mt-1">Manage your tennis events</p>
          </div>
          <button
            onClick={createNewSession}
            disabled={creating}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : '+ Start New Session'}
          </button>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-500 text-center py-8">
              No sessions yet. Click "Start New Session" to begin!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.event_date)
              const formattedDate = eventDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      {event.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : event.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : event.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{formattedDate}</p>
                  {event.start_time && (
                    <p className="text-gray-500 text-sm">
                      Started: {event.start_time}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {event.total_sets} {event.total_sets === 1 ? 'Set' : 'Sets'}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
