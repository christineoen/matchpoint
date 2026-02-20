'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startNewSession() {
    setCreating(true)
    setError(null)
    
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

      if (!response.ok) {
        const data = await response.json()
        console.error('API Error:', data)
        throw new Error(data.error || 'Failed to create session')
      }

      const { event } = await response.json()
      console.log('Event created:', event)
      router.push(`/events/${event.id}`)
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Tennis Match Maker
          </h1>
          <p className="text-gray-600 mb-4">
            Social tennis match-making application
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 max-w-md mx-auto">
              {error}
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={startNewSession}
              disabled={creating}
              className="bg-success text-white px-8 py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {creating ? 'Creating...' : 'Start New Session'}
            </button>
            <Link
              href="/events"
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              View Past Sessions
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">
              1. Select Courts
            </h2>
            <p className="text-gray-600">
              Choose available courts for your session
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">
              2. Add Players
            </h2>
            <p className="text-gray-600">
              Register players with grades and preferences
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">
              3. Generate Matches
            </h2>
            <p className="text-gray-600">
              Automatically create balanced matches
            </p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-2">🚀 Next Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">npm install</code></li>
            <li>Set up your Supabase project and add credentials to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Run the migration: <code className="bg-gray-100 px-2 py-1 rounded">supabase-migration.sql</code></li>
            <li>Start dev server: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></li>
          </ol>
        </div>
      </div>
    </main>
  )
}
