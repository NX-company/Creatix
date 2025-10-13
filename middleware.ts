import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenForMiddleware } from './lib/auth'

const publicPaths = ['/login', '/register', '/welcome']
const adminPaths = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  const isApiRoute = pathname.startsWith('/api/')

  if (isPublicPath) {
    if (token) {
      const user = await verifyTokenForMiddleware(token)
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return NextResponse.next()
  }

  if (!token && !isApiRoute && !pathname.startsWith('/_next')) {
    // Redirect to welcome page for first-time visitors
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token) {
    const user = await verifyTokenForMiddleware(token)
    
    if (!user) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }

    if (isAdminPath && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)

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


