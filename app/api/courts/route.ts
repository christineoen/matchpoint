import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/database-types'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient<Database>(supabaseUrl, supabaseKey)
}

// GET /api/courts - List all courts
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ courts })
  } catch (error) {
    console.error('Error fetching courts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courts' },
      { status: 500 }
    )
  }
}

// POST /api/courts - Create new court
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    
    const { data: court, error } = await supabase
      .from('courts')
      .insert({
        name: body.name,
        surface_type: body.surface_type,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ court }, { status: 201 })
  } catch (error) {
    console.error('Error creating court:', error)
    return NextResponse.json(
      { error: 'Failed to create court' },
      { status: 500 }
    )
  }
}
