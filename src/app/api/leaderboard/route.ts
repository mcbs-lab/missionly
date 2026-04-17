import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'
import { getTodayStr, getMondayOfWeek, getFirstOfMonth } from '@/lib/utils'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || 'all'

  const today = getTodayStr()
  let from: string | null = null
  let to: string | null = null

  if (range === 'today') {
    from = today; to = today
  } else if (range === 'week') {
    from = getMondayOfWeek(new Date()); to = today
  } else if (range === 'month') {
    from = getFirstOfMonth(new Date()); to = today
  }

  const { data: children } = await supabase
    .from('children')
    .select('id, name, avatar_color')
    .eq('household_id', householdId)

  const entries = await Promise.all(
    (children || []).map(async (child) => {
      let choreQuery = supabase
        .from('chore_completions')
        .select('points_awarded')
        .eq('child_id', child.id)
      if (from) choreQuery = choreQuery.gte('date', from)
      if (to) choreQuery = choreQuery.lte('date', to)
      const { data: chores } = await choreQuery
      const chorePoints = (chores || []).reduce((s, c) => s + c.points_awarded, 0)

      const { data: assignments } = await supabase
        .from('challenge_assignments')
        .select('challenge_id, challenges(points_per_unit)')
        .eq('child_id', child.id)

      const challengeIds = (assignments || []).map((a) => a.challenge_id)
      let challengePoints = 0

      if (challengeIds.length > 0) {
        let pq = supabase
          .from('challenge_progress_entries')
          .select('challenge_id, delta_count')
          .eq('child_id', child.id)
          .in('challenge_id', challengeIds)
        if (from) pq = pq.gte('date', from)
        if (to) pq = pq.lte('date', to)
        const { data: progress } = await pq
        const ppu: Record<number, number> = {}
        for (const a of assignments || []) {
          const c = (Array.isArray(a.challenges) ? a.challenges[0] : a.challenges) as { points_per_unit: number } | null
          ppu[a.challenge_id] = c?.points_per_unit || 1
        }
        challengePoints = (progress || []).reduce(
          (s, p) => s + p.delta_count * (ppu[p.challenge_id] || 1), 0
        )
      }

      let adjQuery = supabase
        .from('point_adjustments')
        .select('points')
        .eq('child_id', child.id)
      if (from) adjQuery = adjQuery.gte('date', from)
      if (to) adjQuery = adjQuery.lte('date', to)
      const { data: adjs } = await adjQuery
      const adjPoints = (adjs || []).reduce((s, a) => s + a.points, 0)

      return {
        childId: child.id,
        childName: child.name,
        avatarColor: child.avatar_color,
        totalPoints: chorePoints + challengePoints + adjPoints,
      }
    })
  )

  entries.sort((a, b) => b.totalPoints - a.totalPoints)
  return NextResponse.json(entries)
}
