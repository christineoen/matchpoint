import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'

// GET /api/events/[id]/players - Get players for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('event_players')
      .select(`
        id,
        arrival_order,
        checked_in,
        player:players (
          id,
          name,
          grade,
          gender,
          nhc,
          plus_minus
        )
      `)
      .eq('event_id', eventId)
      .order('arrival_order', { ascending: true }) as any

    if (error) throw error

    // Transform to simpler format
    const players = data?.map((ep: any) => ({
      player_id: ep.player.id,
      player_name: ep.player.name,
      grade: ep.player.grade,
      gender: ep.player.gender,
      nhc: ep.player.nhc,
      plus_minus: ep.player.plus_minus,
      arrival_order: ep.arrival_order,
    }))

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching event players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event players' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/players - Save players for event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { players } = body

    // Delete existing players for this event
    await supabase
      .from('event_players')
      .delete()
      .eq('event_id', eventId)

    // Insert new players
    const insertData = players.map((player: any) => ({
      event_id: eventId,
      player_id: player.player_id,
      arrival_order: player.arrival_order,
      checked_in: false,
    }))

    const { error } = await (supabase as any)
      .from('event_players')
      .insert(insertData)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving event players:', error)
    return NextResponse.json(
      { error: 'Failed to save event players' },
      { status: 500 }
    )
  }
}
