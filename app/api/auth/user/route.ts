import { createServerSupabaseClient } from '@/lib/supabase/server-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ user: null, membership: null })
    }

    // Get user's club
    const { data: membership } = await supabase
      .from('club_members')
      .select('club_id, role, clubs(name)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    return NextResponse.json({ user, membership })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ user: null, membership: null })
  }
}
