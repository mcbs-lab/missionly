import { NextResponse } from 'next/server'
import { isPlatformAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('households')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get member count per household
  const { data: members } = await admin
    .from('household_members')
    .select('household_id')

  const memberCount: Record<number, number> = {}
  for (const m of members || []) {
    memberCount[m.household_id] = (memberCount[m.household_id] || 0) + 1
  }

  return NextResponse.json(
    (data || []).map((h) => ({ ...h, memberCount: memberCount[h.id] || 0 }))
  )
}

export async function POST(request: Request) {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, password } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Auth failed' }, { status: 400 })
  }

  const { data: household, error: hErr } = await admin
    .from('households')
    .insert({ name })
    .select()
    .single()

  if (hErr || !household) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 })
  }

  await admin.from('household_members').insert({
    household_id: household.id,
    user_id: authData.user.id,
    role: 'admin',
  })
  await admin.from('household_settings').insert({ household_id: household.id })

  return NextResponse.json(household, { status: 201 })
}
