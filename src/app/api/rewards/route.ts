import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { childId, title, targetPoints, active, redeemed } = body

  if (!childId || !title || targetPoints === undefined) {
    return NextResponse.json({ error: 'childId, title, targetPoints required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('rewards')
    .insert({
      child_id: childId,
      title,
      target_points: targetPoints,
      active: active !== undefined ? active : true,
      redeemed: redeemed || false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
