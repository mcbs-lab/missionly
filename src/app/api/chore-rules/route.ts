import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')

  let query = supabase
    .from('chore_assignment_rules')
    .select('*, chore_templates(title, icon, points, time_of_day, household_id)')
    .eq('active', true)

  if (childId) query = query.eq('child_id', childId)

  const { data, error } = await query.order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { choreTemplateId, childId, daysOfWeek, active } = body

  const { data, error } = await supabase
    .from('chore_assignment_rules')
    .insert({
      chore_template_id: choreTemplateId,
      child_id: childId,
      days_of_week: JSON.stringify(daysOfWeek || [0, 1, 2, 3, 4, 5, 6]),
      active: active !== undefined ? active : true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
