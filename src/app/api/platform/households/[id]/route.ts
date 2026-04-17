import { NextResponse } from 'next/server'
import { isPlatformAdmin } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isPlatformAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createAdminClient()

  // Get household members to delete auth users
  const { data: members } = await admin
    .from('household_members')
    .select('user_id')
    .eq('household_id', id)

  // Delete household (cascades all related data via FK)
  const { error } = await admin.from('households').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete auth users
  for (const m of members || []) {
    await admin.auth.admin.deleteUser(m.user_id)
  }

  return NextResponse.json({ success: true })
}
