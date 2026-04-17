import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')

  let query = supabase
    .from('recurring_piggy_rules')
    .select('*, recurring_piggy_rule_assignments(child_id)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let results = (data || []).map((r) => ({
    ...r,
    childIds: r.recurring_piggy_rule_assignments.map((a: { child_id: number }) => a.child_id),
  }))

  if (childId) {
    results = results.filter((r) => r.childIds.includes(Number(childId)))
  }

  return NextResponse.json(results)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const body = await request.json()
  const { category, amountCents, title, cadence, startDate, endDate, nextRunDate, active, childIds } = body

  if (!category || !amountCents || !title || !cadence || !startDate || !nextRunDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: rule, error } = await supabase
    .from('recurring_piggy_rules')
    .insert({
      household_id: householdId,
      category,
      amount_cents: amountCents,
      title,
      cadence,
      start_date: startDate,
      end_date: endDate || null,
      next_run_date: nextRunDate,
      active: active !== undefined ? active : true,
    })
    .select()
    .single()

  if (error || !rule) return NextResponse.json({ error: error?.message }, { status: 500 })

  if (childIds && childIds.length > 0) {
    await supabase.from('recurring_piggy_rule_assignments').insert(
      childIds.map((cid: number) => ({ rule_id: rule.id, child_id: cid }))
    )
  }

  return NextResponse.json({ ...rule, childIds: childIds || [] }, { status: 201 })
}
