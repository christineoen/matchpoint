import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/database-types'

// Create a server-side Supabase client for API routes
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET /api/events - List all events
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
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
    const supabase = getSupabaseClient()
    const body = await request.json()
    
    console.log('Creating event with data:', body)
    
    const { name, event_date, start_time, end_time, location, total_sets } = body

    // Validate required fields
    if (!name || !event_date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      )
    }

    // Create event
    const insertData = {
      name,
      event_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      total_sets: total_sets || 6,
      status: 'draft' as const,
    }
    
    console.log('Inserting into Supabase:', insertData)
    
    const { data: event, error } = await (supabase as any)
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
