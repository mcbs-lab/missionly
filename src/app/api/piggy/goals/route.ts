import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const category = url.searchParams.get('category')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  let query = supabase
    .from('piggy_goals')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: true })

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { childId, category, title, targetAmountCents, active } = body

  if (!childId || !category || !title || targetAmountCents === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('piggy_goals')
    .insert({
      child_id: childId,
      category,
      title,
      target_amount_cents: targetAmountCents,
      active: active !== undefined ? active : true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
