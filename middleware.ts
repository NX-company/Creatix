import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPaths = ['/login', '/register', '/welcome']
const adminPaths = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isApiRoute = pathname.startsWith('/api/')

  // Allow public paths and API routes
  if (isPublicPath || isApiRoute || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Check NextAuth session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // Check if this is a guest user from welcome page
  const isGuest = request.nextUrl.searchParams.get('guest') === 'true'
  
  // Check if user has visited before (using cookie)
  const hasVisited = request.cookies.get('has_visited')

  // Check admin access first - require authentication and ADMIN role
  if (isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If no session and not a guest
  if (!token && !isGuest) {
    // Always redirect to welcome page for first-time visitors on root path
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    // Redirect to login for other paths
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If authenticated user visits root and hasn't seen welcome, redirect to welcome
  if (token && pathname === '/' && !hasVisited) {
    const response = NextResponse.redirect(new URL('/welcome', request.url))
    // Set cookie so we don't redirect again
    response.cookies.set('has_visited', 'true', {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
    return response
  }

  // Add user info to headers for server components
  if (token) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.id as string)
    requestHeaders.set('x-user-role', token.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}


