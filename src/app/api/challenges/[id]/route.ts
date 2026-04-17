import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.goalDescription !== undefined) update.goal_description = body.goalDescription
  if (body.targetCount !== undefined) update.target_count = body.targetCount
  if (body.pointsPerUnit !== undefined) update.points_per_unit = body.pointsPerUnit
  if (body.active !== undefined) update.active = body.active

  const { data, error } = await supabase
    .from('challenges')
    .update(update)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { id } = await params

  const { error } = await supabase
    .from('challenges')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
