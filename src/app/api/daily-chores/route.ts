import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'
import { getTodayStr } from '@/lib/utils'

export async function GET(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId')
  const date = url.searchParams.get('date') || getTodayStr()

  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  // Get active assignment rules for this child
  const { data: rules, error: rulesError } = await supabase
    .from('chore_assignment_rules')
    .select('*, chore_templates(*)')
    .eq('child_id', childId)
    .eq('active', true)

  if (rulesError) return NextResponse.json({ error: rulesError.message }, { status: 500 })

  // Filter by day of week
  const todayRules = (rules || []).filter((rule) => {
    try {
      const days: number[] = JSON.parse(rule.days_of_week)
      return days.includes(dayOfWeek)
    } catch {
      return false
    }
  })

  // Get today's completions for this child
  const templateIds = todayRules.map((r) => r.chore_template_id)
  const { data: completions } = templateIds.length > 0
    ? await supabase
        .from('chore_completions')
        .select('*')
        .eq('child_id', childId)
        .eq('date', date)
        .in('chore_template_id', templateIds)
    : { data: [] }

  const completionMap = new Map(
    (completions || []).map((c) => [c.chore_template_id, c])
  )

  const dailyChores = todayRules
    .filter((rule) => rule.chore_templates?.active !== false)
    .map((rule) => {
      const tpl = rule.chore_templates
      const completion = completionMap.get(rule.chore_template_id)
      return {
        choreTemplateId: tpl.id,
        title: tpl.title,
        icon: tpl.icon,
        points: tpl.points,
        timeOfDay: tpl.time_of_day,
        completed: !!completion,
        completionId: completion?.id || null,
      }
    })

  return NextResponse.json(dailyChores)
}
