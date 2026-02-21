import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'
import type { Database } from '@/database-types'

// Create a server-side Supabase client for API routes
async function getSupabaseClient() {
  return await createServerSupabaseClient()
}

// GET /api/events - List all events
export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()
    
    console.log('Creating event with data:', body)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('Authenticated user:', user.id)

    // Get user's club from club_members
    const { data: membership, error: memberError } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    
    console.log('Membership data:', membership, 'Error:', memberError)
    
    const clubId = membership?.club_id

    console.log('Final club_id:', clubId)

    if (!clubId) {
      return NextResponse.json(
        { error: 'No club found. Please create a club first.' },
        { status: 400 }
      )
    }
    
    const { name, event_date, start_time, end_time, location, total_sets } = body

    // Validate required fields
    if (!name || !event_date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      )
    }

    // Create event with club_id
    const insertData = {
      name,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      total_sets: total_sets || 6,
      status: 'draft' as const,
      club_id: clubId,
      organizer_id: user.id,
    }
    
    console.log('Inserting into Supabase:', insertData)
    
    const { data: event, error } = await supabase
      .from('events')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw error
    }
    
    console.log('Event created successfully:', event)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}
