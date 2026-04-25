import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  // Avoid noisy 404s in environments where browsers still request /favicon.ico.
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
