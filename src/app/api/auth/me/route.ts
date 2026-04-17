import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No household' }, { status: 403 })
  }

  const { data: household } = await supabase
    .from('households')
    .select('id, name')
    .eq('id', member.household_id)
    .single()

  return NextResponse.json({
    type: 'household',
    id: household?.id,
    name: household?.name,
    email: user.email,
    role: member.role,
  })
}
