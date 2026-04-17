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
    .from('point_adjustments')
    .select('*')
    .eq('child_id', childId)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { childId, points, reason, date } = body

  if (!childId || points === undefined || !reason || !date) {
    return NextResponse.json({ error: 'childId, points, reason, date required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('point_adjustments')
    .insert({ child_id: childId, points, reason, date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
