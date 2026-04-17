import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { id } = await params
  const body = await request.json()
  const { name, avatarColor, birthdate } = body

  const update: Record<string, unknown> = {}
  if (name !== undefined) update.name = name
  if (avatarColor !== undefined) update.avatar_color = avatarColor
  if (birthdate !== undefined) update.birthdate = birthdate

  const { data, error } = await supabase
    .from('children')
    .update(update)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase, householdId } = ctx
  const { id } = await params

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
