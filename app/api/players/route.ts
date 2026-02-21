import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'

// GET /api/players - List all active players in user's club
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // RLS policies automatically filter by club membership
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

// POST /api/players - Create new player
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
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

    // Create player
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        club_id: membership.club_id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        gender: body.gender,
        grade: body.grade,
        nhc: body.nhc || false,
        plus_minus: body.plus_minus || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}
