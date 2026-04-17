import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function POST(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const body = await request.json()
  const { childId, choreTemplateId, date } = body

  if (!childId || !choreTemplateId || !date) {
    return NextResponse.json({ error: 'childId, choreTemplateId, date required' }, { status: 400 })
  }

  // Check for existing completion
  const { data: existing } = await supabase
    .from('chore_completions')
    .select('id')
    .eq('child_id', childId)
    .eq('chore_template_id', choreTemplateId)
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    // Toggle off: remove completion
    const { error } = await supabase
      .from('chore_completions')
      .delete()
      .eq('id', existing.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ completed: false })
  } else {
    // Toggle on: get points from template and create completion
    const { data: tpl } = await supabase
      .from('chore_templates')
      .select('points')
      .eq('id', choreTemplateId)
      .single()

    const { data, error } = await supabase
      .from('chore_completions')
      .insert({
        child_id: childId,
        chore_template_id: choreTemplateId,
        date,
        completed: true,
        points_awarded: tpl?.points || 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ completed: true, completion: data })
  }
}
