import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'
import type { Database } from '@/database-types'
import { generateMatches } from '@/lib/match-generation'
import type { EventPlayer, MatchFormat } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { set_number, format } = body

    // Get event courts
    const { data: eventCourts, error: courtsError } = await supabase
      .from('event_courts')
      .select('*, courts(*)')
      .eq('event_id', eventId)
      .order('selection_order', { ascending: true })

    if (courtsError) {
      console.error('Error fetching courts:', courtsError)
      throw courtsError
    }

    console.log('Raw event courts data:', eventCourts)

    const courts = (eventCourts || []).map((ec: any) => ({
      name: ec.courts.name,
      surfaceType: ec.courts.surface_type,
    }))

    // Get event players
    const { data: eventPlayersData, error: playersError } = await supabase
      .from('event_players')
      .select('*, players(*)')
      .eq('event_id', eventId)
      .order('arrival_order', { ascending: true })

    if (playersError) {
      console.error('Error fetching players:', playersError)
      throw playersError
    }

    console.log('Raw event players data:', eventPlayersData)

    // Transform to EventPlayer format
    const players: EventPlayer[] = (eventPlayersData || []).map((ep: any, index: number) => ({
      id: ep.players.id,
      name: ep.players.name,
      grade: ep.players.grade,
      gender: ep.players.gender,
      nhc: ep.players.nhc,
      plusMinus: ep.players.plus_minus || '',
      arrivalOrder: ep.arrival_order || index + 1,
      isResting: false, // Default to not resting
      unavailableSets: {
        set1: false,
        set2: false,
        set3: false,
        set4: false,
        set5: false,
        set6: false,
      },
      pso: false, // TODO: Calculate from history
      so: false,  // Will be calculated
    }))

    // Delete existing matches for this set
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('event_id', eventId)
      .eq('set_number', set_number)

    if (deleteError) {
      console.error('Error deleting existing matches:', deleteError)
    }

    // Generate matches
    const result = generateMatches({
      players,
      courts,
      setNumber: set_number,
      format: format as MatchFormat,
      manualMatches: [],
    })

    console.log('Match generation result:', {
      matchCount: result.matches.length,
      warnings: result.warnings,
      playerCount: players.length,
      courtCount: courts.length,
      format,
      setNumber: set_number,
      playersDetail: players.map(p => ({ name: p.name, gender: p.gender })),
      courtsDetail: courts,
    })

    if (result.warnings.length > 0) {
      console.log('Match generation warnings:', result.warnings)
    }

    // Save matches to database
    const savedMatches: any[] = []
    
    // Create a map of court names to court IDs for easier lookup
    const courtMap = new Map<string, string>()
    for (const ec of (eventCourts || [])) {
      courtMap.set(ec.courts.name, ec.courts.id)
    }
    
    console.log('Court map:', Array.from(courtMap.entries()))
    
    for (const match of result.matches) {
      console.log('Saving match for court:', match.court)
      
      // Get court ID
      const courtId = courtMap.get(match.court)
      if (!courtId) {
        console.error('Court not found:', match.court, 'Available:', Array.from(courtMap.keys()))
        continue
      }

      console.log('Found court ID:', courtId, 'for court:', match.court)

      // Insert match
      const { data: matchData, error: matchError } = await (supabase as any)
        .from('matches')
        .insert({
          event_id: eventId,
          court_id: courtId,
          set_number: set_number,
          format: match.format,
          is_manual: match.isManual,
          notes: match.note || null,
        } as any)
        .select()
        .single() as any

      if (matchError) {
        console.error('Error saving match:', matchError)
        continue
      }

      console.log('Match saved successfully:', matchData)

      // Insert match players
      const matchPlayers = [
        ...match.team1.map((p, idx) => ({
          match_id: (matchData as any).id,
          player_id: p.id,
          team: 1 as const,
          position: idx + 1,
        })),
        ...match.team2.map((p, idx) => ({
          match_id: (matchData as any).id,
          player_id: p.id,
          team: 2 as const,
          position: idx + 1,
        })),
      ]

      const { error: playersError } = await supabase.from('match_players').insert(matchPlayers as any)
      
      if (playersError) {
        console.error('Error saving match players:', playersError)
        continue
      }

      console.log('Match players saved successfully for match:', matchData.id)

      savedMatches.push(matchData)
    }

    console.log('Total matches saved:', savedMatches.length)

    return NextResponse.json({
      matches: savedMatches,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Error generating matches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate matches' },
      { status: 500 }
    )
  }
}
