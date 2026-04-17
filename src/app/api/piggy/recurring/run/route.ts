import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'
import { getTodayStr, addDays, addWeeks, addMonths } from '@/lib/utils'

export async function POST() {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const today = getTodayStr()

  const { data: rules, error } = await supabase
    .from('recurring_piggy_rules')
    .select('*, recurring_piggy_rule_assignments(child_id)')
    .eq('household_id', householdId)
    .eq('active', true)
    .lte('next_run_date', today)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let totalPosted = 0

  for (const rule of rules || []) {
    // Deactivate if end_date has passed
    if (rule.end_date && rule.end_date < today) {
      await supabase.from('recurring_piggy_rules').update({ active: false }).eq('id', rule.id)
      continue
    }

    const childIds = rule.recurring_piggy_rule_assignments.map(
      (a: { child_id: number }) => a.child_id
    )

    for (const childId of childIds) {
      await supabase.from('piggy_transactions').insert({
        child_id: childId,
        category: rule.category,
        amount_cents: rule.amount_cents,
        title: rule.title,
        date: rule.next_run_date,
      })
      totalPosted++
    }

    let nextRun: string
    if (rule.cadence === 'DAILY') nextRun = addDays(rule.next_run_date, 1)
    else if (rule.cadence === 'WEEKLY') nextRun = addWeeks(rule.next_run_date, 1)
    else nextRun = addMonths(rule.next_run_date, 1)

    await supabase
      .from('recurring_piggy_rules')
      .update({ next_run_date: nextRun })
      .eq('id', rule.id)
  }

  return NextResponse.json({ posted: totalPosted })
}
