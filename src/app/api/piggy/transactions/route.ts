import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const category = url.searchParams.get('category')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  let query = supabase
    .from('piggy_transactions')
    .select('*')
    .eq('child_id', childId)
    .order('date', { ascending: false })

  if (category) query = query.eq('category', category)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { childId, category, amountCents, title, date } = body

  if (!childId || !category || amountCents === undefined || !title || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('piggy_transactions')
    .insert({ child_id: childId, category, amount_cents: amountCents, title, date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
