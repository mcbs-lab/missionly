import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { challengeId, childIds } = body

  if (!challengeId || !childIds?.length) {
    return NextResponse.json({ error: 'challengeId and childIds required' }, { status: 400 })
  }

  // Remove existing and re-add
  await supabase.from('challenge_assignments').delete().eq('challenge_id', challengeId)

  const { error } = await supabase.from('challenge_assignments').insert(
    childIds.map((cid: number) => ({ challenge_id: challengeId, child_id: cid }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
