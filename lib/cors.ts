import { NextResponse } from 'next/server';

// CORS headers to allow requests from any origin (including Expo Go apps)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export function handleOptions() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export function jsonWithCors(data: any, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}