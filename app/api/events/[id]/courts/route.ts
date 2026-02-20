import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/database-types'
import type { EventCourtWithCourt } from '@/lib/supabase/query-types'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET /api/events/[id]/courts - Get courts for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('event_courts')
      .select(`
        id,
        selection_order,
        is_available,
        court:courts (
          id,
          name,
          surface_type
        )
      `)
      .eq('event_id', eventId)
      .order('selection_order', { ascending: true })

    if (error) throw error

    // Use 'as unknown as Type' for better type safety than 'as any'
    const eventCourts = data as unknown as EventCourtWithCourt[]

    // Transform to simpler format
    const courts = eventCourts?.map(ec => ({
      court_id: ec.court.id,
      court_name: ec.court.name,
      surface_type: ec.court.surface_type,
      selection_order: ec.selection_order,
    }))

    return NextResponse.json({ courts })
  } catch (error) {
    console.error('Error fetching event courts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event courts' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/courts - Save courts for event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { courts } = body

    // Delete existing courts for this event
    await supabase
      .from('event_courts')
      .delete()
      .eq('event_id', eventId)

    // Insert new courts - use 'as any' only on the insert operation
    const insertData = courts.map((court: any) => ({
      event_id: eventId,
      court_id: court.court_id,
      selection_order: court.selection_order,
      is_available: true,
    }))

    const { error } = await (supabase as any)
      .from('event_courts')
      .insert(insertData as any)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving event courts:', error)
    return NextResponse.json(
      { error: 'Failed to save event courts' },
      { status: 500 }
    )
  }
}
