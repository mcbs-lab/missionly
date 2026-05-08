import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET() {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { data, error } = await supabase
    .from('chore_templates')
    .select('*, chore_assignment_rules(*, children(name))')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const body = await request.json()
  const { title, icon, description, points, timeOfDay, assignments } = body

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data: template, error: tplError } = await supabase
    .from('chore_templates')
    .insert({
      household_id: householdId,
      title,
      icon: icon || 'sparkles',
      description: description || null,
      points: points || 1,
      time_of_day: timeOfDay || 'ALL_DAY',
      active: true,
    })
    .select()
    .single()

  if (tplError || !template) {
    return NextResponse.json({ error: tplError?.message || 'Failed to create chore' }, { status: 500 })
  }

  if (assignments && assignments.length > 0) {
    const rules = assignments.map((a: { childId: number; daysOfWeek: number[] }) => ({
      chore_template_id: template.id,
      child_id: a.childId,
      days_of_week: JSON.stringify(a.daysOfWeek),
      active: true,
    }))
    await supabase.from('chore_assignment_rules').insert(rules)
  }

  return NextResponse.json(template, { status: 201 })
}
