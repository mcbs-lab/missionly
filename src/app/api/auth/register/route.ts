import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, householdName } = body

  if (!email || !password || !householdName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 })
  }

  const userId = authData.user.id

  // Create household
  const { data: household, error: householdError } = await admin
    .from('households')
    .insert({ name: householdName })
    .select()
    .single()

  if (householdError || !household) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 })
  }

  // Link user to household
  const { error: memberError } = await admin
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId, role: 'admin' })

  if (memberError) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to link user to household' }, { status: 500 })
  }

  // Create default household settings
  await admin
    .from('household_settings')
    .insert({
      household_id: household.id,
      show_affirmation: true,
      show_saint: true,
      show_bible_passage: true,
    })

  // Sign in the new user
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

  if (signInError) {
    return NextResponse.json({ error: 'Account created but sign-in failed. Please log in.' }, { status: 200 })
  }

  return NextResponse.json({ success: true, householdId: household.id })
}
