import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'

// POST /api/players/import - Import players from CSV
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's club
    const { data: membership } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    
    if (!membership?.club_id) {
      return NextResponse.json(
        { error: 'No club found' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { players } = body

    if (!Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: 'Invalid players data' },
        { status: 400 }
      )
    }

    // Prepare players for insert
    const playersToInsert = players.map(p => ({
      club_id: membership.club_id,
      name: p.name,
      email: p.email || null,
      phone: p.phone || null,
      gender: p.gender,
      grade: p.grade,
      nhc: p.nhc || false,
      plus_minus: p.plus_minus || null,
      is_active: true,
    }))

    // Bulk insert
    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      players: data 
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing players:', error)
    return NextResponse.json(
      { error: 'Failed to import players' },
      { status: 500 }
    )
  }
}
