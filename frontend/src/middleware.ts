import { NextRequest, NextResponse } from 'next/server'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isTokenExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number
  return !exp || Date.now() / 1000 > exp
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths — always accessible
  const publicPaths = ['/login', '/pay']
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for access token in cookie (set by auth store)
  const tokenCookie = request.cookies.get('access_token')?.value
  const authHeader = request.headers.get('authorization')
  const token = tokenCookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = decodeJwtPayload(token)
  if (!payload || isTokenExpired(payload)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = payload.role as string

  // Admin routes — require admin role
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/pos', request.url))
    }
  }

  // POS routes — redirect admin to dashboard
  if (pathname.startsWith('/pos') || pathname.startsWith('/payment') ||
      pathname.startsWith('/history') || pathname.startsWith('/settings') ||
      pathname.startsWith('/links') || pathname.startsWith('/setup') ||
      pathname.startsWith('/first-access') || pathname.startsWith('/terms')) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|api|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)',
  ],
}
