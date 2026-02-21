import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/courts/import - Import courts from CSV
export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS for global courts
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const body = await request.json()
    const { courts } = body

    if (!Array.isArray(courts) || courts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid courts data' },
        { status: 400 }
      )
    }

    // Prepare courts for insert
    const courtsToInsert = courts.map(c => ({
      name: c.name,
      surface_type: c.surface_type,
      is_active: true,
    }))

    // Bulk insert
    const { data, error } = await supabaseAdmin
      .from('courts')
      .insert(courtsToInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      count: data.length,
      courts: data 
    }, { status: 201 })
  } catch (error) {
    console.error('Error importing courts:', error)
    return NextResponse.json(
      { error: 'Failed to import courts' },
      { status: 500 }
    )
  }
}
