import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyTokenForMiddleware } from '@/lib/auth'

const publicPaths = ['/login', '/register', '/welcome', '/legal']
const adminPaths = ['/admin']
const adminPublicPaths = ['/admin/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isAdminPublicPath = adminPublicPaths.some(path => pathname.startsWith(path))
  const isApiRoute = pathname.startsWith('/api/')

  // Allow public paths and API routes
  if (isPublicPath || isApiRoute || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Allow admin login page without authentication
  if (isAdminPublicPath) {
    return NextResponse.next()
  }

  // Check admin access first - use auth-token cookie
  if (isAdminPath) {
    const authToken = request.cookies.get('auth-token')?.value
    
    console.log('🔐 Admin path access attempt:', {
      path: pathname,
      hasAuthToken: !!authToken
    })
    
    if (!authToken) {
      console.log('❌ No auth-token, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Verify admin token
    const adminUser = await verifyTokenForMiddleware(authToken)
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      console.log('❌ Invalid admin token or not admin role, redirecting to admin login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    console.log('✅ Admin access granted for:', adminUser.id)
    
    // Add admin info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-id', adminUser.id)
    requestHeaders.set('x-admin-role', adminUser.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  // Check NextAuth session for regular users
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  // Check if this is a guest user from welcome page
  const isGuest = request.nextUrl.searchParams.get('guest') === 'true'
  
  // Check if user has visited before (using cookie)
  const hasVisited = request.cookies.get('has_visited')

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


