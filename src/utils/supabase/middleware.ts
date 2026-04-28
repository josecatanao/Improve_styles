import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function sanitizeMode(value: string | null) {
  return value === 'customer' ? 'customer' : 'admin'
}

function sanitizeNextPath(value: string | null, mode: 'customer' | 'admin') {
  const defaultPath = mode === 'customer' ? '/' : '/dashboard'
  return value && value.startsWith('/') ? value : defaultPath
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/dashboard') && user?.user_metadata.account_type === 'customer') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect logged-in users away from /login
  const mode = sanitizeMode(request.nextUrl.searchParams.get('mode'))
  const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get('next'), mode)

  if (request.nextUrl.pathname.startsWith('/login') && user) {
    if (mode === 'customer' && user.user_metadata.account_type === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.redirect(new URL(nextPath, request.url))
  }

  if (request.nextUrl.pathname.startsWith('/admin/login') && user) {
    if (user.user_metadata.account_type === 'customer') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
