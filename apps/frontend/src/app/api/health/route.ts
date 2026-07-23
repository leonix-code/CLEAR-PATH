import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ClearPath Frontend',
      version: '1.0.0',
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
