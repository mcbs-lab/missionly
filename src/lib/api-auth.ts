import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const PLATFORM_ADMIN_SECRET = new TextEncoder().encode(
  process.env.PLATFORM_ADMIN_SECRET || 'missionly-platform-admin-secret-2024'
)

export type HouseholdContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: { id: string; email: string | undefined }
  householdId: number
  role: string
}

export type ErrorContext = {
  error: string
  status: number
}

export async function getHouseholdCtx(): Promise<HouseholdContext | ErrorContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized', status: 401 }

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single()

  if (!member) return { error: 'No household found', status: 403 }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    householdId: member.household_id,
    role: member.role,
  }
}

export function isError(ctx: HouseholdContext | ErrorContext): ctx is ErrorContext {
  return 'error' in ctx
}

export function errorResponse(ctx: ErrorContext) {
  return NextResponse.json({ error: ctx.error }, { status: ctx.status })
}

export async function isPlatformAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('platform_admin_token')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, PLATFORM_ADMIN_SECRET)
    return payload.isPlatformAdmin === true
  } catch {
    return false
  }
}
