import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const { id } = await params
  const body = await request.json()
  const { childId, date, deltaCount, note } = body

  if (!childId || !date || deltaCount === undefined) {
    return NextResponse.json({ error: 'childId, date, deltaCount required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('challenge_progress_entries')
    .insert({
      challenge_id: Number(id),
      child_id: childId,
      date,
      delta_count: deltaCount,
      note: note || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
