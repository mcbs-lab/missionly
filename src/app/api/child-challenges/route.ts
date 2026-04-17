import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  // Get assignments for this child
  const { data: assignments, error } = await supabase
    .from('challenge_assignments')
    .select('challenge_id, challenges(*)')
    .eq('child_id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const challengeIds = (assignments || []).map((a) => a.challenge_id)

  if (challengeIds.length === 0) return NextResponse.json([])

  // Get progress totals for each challenge
  const { data: progress } = await supabase
    .from('challenge_progress_entries')
    .select('challenge_id, delta_count')
    .eq('child_id', childId)
    .in('challenge_id', challengeIds)

  const progressMap: Record<number, number> = {}
  for (const p of progress || []) {
    progressMap[p.challenge_id] = (progressMap[p.challenge_id] || 0) + p.delta_count
  }

  type ChallengeRow = { id: number; title: string; goal_description: string; target_count: number; points_per_unit: number; active: boolean }
  const result = (assignments || [])
    .filter((a) => {
      const c = a.challenges as ChallengeRow | ChallengeRow[]
      if (Array.isArray(c)) return c[0]?.active !== false
      return c?.active !== false
    })
    .map((a) => {
      const c = (Array.isArray(a.challenges) ? a.challenges[0] : a.challenges) as ChallengeRow
      return {
        challengeId: c.id,
        title: c.title,
        goalDescription: c.goal_description,
        targetCount: c.target_count,
        pointsPerUnit: c.points_per_unit,
        currentCount: progressMap[c.id] || 0,
      }
    })

  return NextResponse.json(result)
}
