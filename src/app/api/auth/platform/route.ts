import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const PLATFORM_ADMIN_SECRET = new TextEncoder().encode(
  process.env.PLATFORM_ADMIN_SECRET || 'missionly-platform-admin-secret-2024'
)

export async function POST(request: Request) {
  const body = await request.json()
  const { username, password } = body

  const validUsername = process.env.PLATFORM_ADMIN_USERNAME || 'admin'
  const validPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'admin123'

  if (username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await new SignJWT({ isPlatformAdmin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(PLATFORM_ADMIN_SECRET)

  const response = NextResponse.json({ success: true })
  response.cookies.set('platform_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('platform_admin_token', '', { maxAge: 0, path: '/' })
  return response
}
