import { NextResponse } from 'next/server'
import { getHouseholdCtx, isError, errorResponse } from '@/lib/api-auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; childId: string }> }
) {
  const ctx = await getHouseholdCtx()
  if (isError(ctx)) return errorResponse(ctx)

  const { supabase } = ctx
  const { id, childId } = await params

  const { error } = await supabase
    .from('challenge_assignments')
    .delete()
    .eq('challenge_id', id)
    .eq('child_id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
