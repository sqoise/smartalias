import { NextResponse } from 'next/server'

export function middleware(request) {
  // For now, middleware just passes through all requests
  // IP blocking will be handled at the API route level instead
  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  // Run on all routes except static files and API routes for blocked IPs
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
