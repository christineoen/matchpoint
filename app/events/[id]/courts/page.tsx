'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Court } from '@/database-types'

interface SelectedCourt {
  court_id: string
  court_name: string
  surface_type: 'grass' | 'hard'
  selection_order: number
}

export default function CourtSelectionPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [allCourts, setAllCourts] = useState<Court[]>([])
  const [selectedCourts, setSelectedCourts] = useState<SelectedCourt[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCourts()
    fetchSelectedCourts()
  }, [eventId])

  async function fetchCourts() {
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      setAllCourts(data.courts || [])
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
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
    // Reorder
    const reordered = filtered.map((sc, index) => ({
      ...sc,
      selection_order: index + 1,
    }))
    setSelectedCourts(reordered)
  }

  function clearAll() {
    setSelectedCourts([])
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

      router.push(`/events/${eventId}`)
    } catch (error) {
      console.error('Error saving courts:', error)
      alert('Failed to save courts')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courts...</p>
          </div>
        </div>
      </main>
    )
  }

  const availableCourts = allCourts.filter(c => !isCourtSelected(c.id))

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
          <h1 className="text-3xl font-bold text-gray-800">Select Courts</h1>
          <p className="text-gray-600 mt-1">
            Choose courts in the order they will be used
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Courts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Selected Courts ({selectedCourts.length})
              </h2>
              {selectedCourts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedCourts.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Click courts below to add them
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedCourts.map((sc) => (
                  <div
                    key={sc.court_id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      sc.surface_type === 'hard'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-6">
                        {sc.selection_order}.
                      </span>
                      <span className="font-bold text-lg">
                        {sc.court_name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-white">
                        {sc.surface_type}
                      </span>
                    </div>
                    <button
                      onClick={() => removeCourt(sc.court_id)}
                      className="text-red-600 hover:text-red-700 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Courts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Available Courts
            </h2>

            {availableCourts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                All courts have been selected
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableCourts.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => addCourt(court)}
                    className={`p-4 rounded-lg font-bold text-white text-lg transition hover:scale-105 ${
                      court.surface_type === 'hard'
                        ? 'bg-primary hover:bg-blue-700'
                        : 'bg-success hover:bg-green-600'
                    }`}
                  >
                    {court.name}
                  </button>
                ))}
              </div>
            )}
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
            onClick={saveCourts}
            disabled={saving || selectedCourts.length === 0}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Courts'}
          </button>
        </div>
      </div>
    </main>
  )
}
