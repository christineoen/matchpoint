'use client'

import { logout } from '@/app/login/actions'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setMembership(data.membership)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  if (!user) {
    return null
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="hover:opacity-80 transition">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Tennis Match Maker</h1>
              {membership && (
                <p className="text-sm text-gray-500 mt-1">
                  {membership.clubs?.name || 'Unknown Club'} • {membership.role}
                </p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex border-t border-gray-200">
          <Link
            href="/?tab=events"
            className={`px-8 py-4 font-semibold border-b-2 transition ${
              isActive('/') || pathname.startsWith('/events')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Events
          </Link>
          <Link
            href="/?tab=players"
            className={`px-8 py-4 font-semibold border-b-2 transition ${
              pathname === '/' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'players'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Players
          </Link>
          <Link
            href="/?tab=courts"
            className={`px-8 py-4 font-semibold border-b-2 transition ${
              pathname === '/' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'courts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Courts
          </Link>
        </nav>
      </div>
    </header>
  )
}
