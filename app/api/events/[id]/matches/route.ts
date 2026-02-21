import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'
import type { Database } from '@/database-types'

// GET /api/events/[id]/matches - Get matches for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createServerSupabaseClient()
    
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        id,
        set_number,
        format,
        is_manual,
        notes,
        court:courts(name, surface_type),
        match_players(
          team,
          position,
          player:players(id, name, grade, gender, plus_minus)
        )
      `)
      .eq('event_id', eventId)
      .order('set_number', { ascending: true }) as any

    if (error) throw error

    // Group by set number
    const matchesBySet: Record<number, any[]> = {}
    
    matches?.forEach((match: any) => {
      if (!matchesBySet[match.set_number]) {
        matchesBySet[match.set_number] = []
      }
      
      // Organize players by team
      const team1 = match.match_players
        .filter((mp: any) => mp.team === 1)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((mp: any) => mp.player)
      
      const team2 = match.match_players
        .filter((mp: any) => mp.team === 2)
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((mp: any) => mp.player)
      
      matchesBySet[match.set_number].push({
        id: match.id,
        court: match.court.name,
        surface_type: match.court.surface_type,
        format: match.format,
        is_manual: match.is_manual,
        notes: match.notes,
        team1,
        team2,
      })
    })

    return NextResponse.json({ matchesBySet })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
