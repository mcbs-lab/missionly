import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const PLATFORM_ADMIN_SECRET = new TextEncoder().encode(
  process.env.PLATFORM_ADMIN_SECRET || 'missionly-platform-admin-secret-2024'
)

async function verifyPlatformAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, PLATFORM_ADMIN_SECRET)
    return payload.isPlatformAdmin === true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Platform admin routes — check custom JWT cookie
  if (pathname.startsWith('/platform-admin/dashboard')) {
    const token = request.cookies.get('platform_admin_token')?.value
    if (!token || !(await verifyPlatformAdminToken(token))) {
      return NextResponse.redirect(new URL('/platform-admin/login', request.url))
    }
    return NextResponse.next()
  }

  // API platform routes — checked at route level with service role
  if (pathname.startsWith('/api/platform/')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected app routes
  if (
    (pathname.startsWith('/kids') || pathname.startsWith('/admin')) &&
    !user
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from login
  if ((pathname === '/' || pathname === '/login') && user) {
    return NextResponse.redirect(new URL('/kids', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
