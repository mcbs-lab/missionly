import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET() {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { data, error } = await supabase
    .from('challenges')
    .select('*, challenge_assignments(child_id)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const formatted = (data || []).map((c) => ({
    ...c,
    childIds: c.challenge_assignments.map((a: { child_id: number }) => a.child_id),
  }))

  return NextResponse.json(formatted)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const body = await request.json()
  const { title, goalDescription, targetCount, pointsPerUnit, active, childIds } = body

  if (!title || !goalDescription) {
    return NextResponse.json({ error: 'title and goalDescription required' }, { status: 400 })
  }

  const { data: challenge, error } = await supabase
    .from('challenges')
    .insert({
      household_id: householdId,
      title,
      goal_description: goalDescription,
      target_count: targetCount || 10,
      points_per_unit: pointsPerUnit || 1,
      active: active !== undefined ? active : true,
    })
    .select()
    .single()

  if (error || !challenge) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (childIds && childIds.length > 0) {
    await supabase.from('challenge_assignments').insert(
      childIds.map((cid: number) => ({ challenge_id: challenge.id, child_id: cid }))
    )
  }

  return NextResponse.json(challenge, { status: 201 })
}
