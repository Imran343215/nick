import { NextResponse } from 'next/server';

/**
 * CORS middleware for React Native API requests
 * Adds CORS headers to all API routes so the RN app can fetch data
 */
export function middleware(request: Request) {
  const response = NextResponse.next();
  const url = new URL(request.url);

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const preflightHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, { status: 200, headers: preflightHeaders });
  }

  // Add CORS headers to all API responses
  if (url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};