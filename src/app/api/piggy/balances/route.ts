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
    .from('piggy_transactions')
    .select('category, amount_cents')
    .eq('child_id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const balances = { FUN: 0, SAVINGS: 0, DONATE: 0 }
  for (const t of data || []) {
    balances[t.category as keyof typeof balances] += t.amount_cents
  }

  return NextResponse.json(balances)
}
