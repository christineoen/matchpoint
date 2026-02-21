import { createServerSupabaseClient } from '@/lib/supabase/server-auth'
import { logout } from '@/app/login/actions'
import Link from 'next/link'

export default async function Header() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user's club
  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, role, clubs(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80 transition">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tennis Match Maker</h1>
            {membership && (
              <p className="text-sm text-gray-500 mt-1">
                {(membership.clubs as any)?.name || 'Unknown Club'} • {membership.role}
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
    </header>
  )
}
