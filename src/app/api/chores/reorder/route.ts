import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

// PATCH /api/chores/reorder  — body: { ids: number[] }  (ordered list of chore template IDs)
export async function PATCH(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { ids }: { ids: number[] } = await request.json()

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  // Update each chore's sort_order in parallel, but verify they belong to this household
  const updates = ids.map((id, index) =>
    supabase
      .from('chore_templates')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('household_id', householdId)
  )

  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}
