'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server-auth'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const clubName = formData.get('clubName') as string

  console.log('Signup data:', { email, clubName })
  // Password is intentionally NOT logged for security

  const supabase = await createServerSupabaseClient()

  // Create user account (Supabase handles password encryption)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create account' }
  }

  // Use service role client for admin operations during signup
  const { createClient } = await import('@supabase/supabase-js')
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

  // Create the club using admin client
  const { data: club, error: clubError } = await supabaseAdmin
    .from('clubs')
    .insert({
      name: clubName,
    })
    .select()
    .single()

  if (clubError) {
    console.error('Club creation error:', clubError)
    return { error: 'Failed to create club: ' + clubError.message }
  }

  console.log('Club created successfully:', club)

  // Add user as admin of the club (using admin client)
  const { error: memberError } = await supabaseAdmin
    .from('club_members')
    .insert({
      club_id: club.id,
      user_id: authData.user.id,
      role: 'admin',
    })

  if (memberError) {
    console.error('Club member error:', memberError)
    return { error: 'Failed to add you as club admin: ' + memberError.message }
  }

  console.log('Added user as club admin')

  revalidatePath('/', 'layout')
  redirect('/')
}
