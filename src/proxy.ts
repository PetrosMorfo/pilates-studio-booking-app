import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session so Server Components can read it, and capture the user
  // for the auth gate below.
  // We distinguish between "confirmed no session" and "error checking" —
  // only redirect on confirmed no-session so a transient network hiccup
  // (e.g. tab waking up after sleep, Supabase briefly slow) doesn't log
  // the user out unexpectedly.
  let user = null
  let confirmedNoSession = false
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // AuthSessionMissingError means there genuinely is no session
      confirmedNoSession = error.name === 'AuthSessionMissingError'
    } else {
      user = data.user
      confirmedNoSession = !user
    }
  } catch {
    // Network/unexpected error — don't redirect, let the page load and
    // handle auth state client-side.
    confirmedNoSession = false
  }

  // Auth gate: redirect unauthenticated users to /login
  const pathname = request.nextUrl.pathname
  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')

  if (confirmedNoSession && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
