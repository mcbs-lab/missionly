import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function GET() {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { data } = await supabase
    .from('household_settings')
    .select('*')
    .eq('household_id', householdId)
    .single()

  if (!data) {
    // Create defaults if not found
    const { data: created } = await supabase
      .from('household_settings')
      .insert({ household_id: householdId })
      .select()
      .single()
    return NextResponse.json(created)
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.show_affirmation !== undefined) update.show_affirmation = body.show_affirmation
  if (body.show_saint !== undefined) update.show_saint = body.show_saint
  if (body.show_bible_passage !== undefined) update.show_bible_passage = body.show_bible_passage

  const { data, error } = await supabase
    .from('household_settings')
    .upsert({ household_id: householdId, ...update })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
