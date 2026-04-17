import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Chore points
  let choreQuery = supabase
    .from('chore_completions')
    .select('points_awarded')
    .eq('child_id', childId)
  if (from) choreQuery = choreQuery.gte('date', from)
  if (to) choreQuery = choreQuery.lte('date', to)
  const { data: chores } = await choreQuery
  const chorePoints = (chores || []).reduce((sum, c) => sum + c.points_awarded, 0)

  // Challenge points
  const { data: assignments } = await supabase
    .from('challenge_assignments')
    .select('challenge_id, challenges(points_per_unit)')
    .eq('child_id', childId)

  const challengeIds = (assignments || []).map((a) => a.challenge_id)
  let challengePoints = 0

  if (challengeIds.length > 0) {
    let progressQuery = supabase
      .from('challenge_progress_entries')
      .select('challenge_id, delta_count')
      .eq('child_id', childId)
      .in('challenge_id', challengeIds)
    if (from) progressQuery = progressQuery.gte('date', from)
    if (to) progressQuery = progressQuery.lte('date', to)
    const { data: progress } = await progressQuery

    const ppu: Record<number, number> = {}
    for (const a of assignments || []) {
      const c = (Array.isArray(a.challenges) ? a.challenges[0] : a.challenges) as { points_per_unit: number } | null
      ppu[a.challenge_id] = c?.points_per_unit || 1
    }
    challengePoints = (progress || []).reduce(
      (sum, p) => sum + p.delta_count * (ppu[p.challenge_id] || 1),
      0
    )
  }

  // Adjustment points
  let adjQuery = supabase
    .from('point_adjustments')
    .select('points')
    .eq('child_id', childId)
  if (from) adjQuery = adjQuery.gte('date', from)
  if (to) adjQuery = adjQuery.lte('date', to)
  const { data: adjustments } = await adjQuery
  const adjustmentPoints = (adjustments || []).reduce((sum, a) => sum + a.points, 0)

  return NextResponse.json({
    chorePoints,
    challengePoints,
    adjustmentPoints,
    totalPoints: chorePoints + challengePoints + adjustmentPoints,
  })
}
