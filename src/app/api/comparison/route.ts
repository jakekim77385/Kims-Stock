// GET /api/comparison — 전체 자산군 비교표
import { NextResponse } from 'next/server';
import { fetchComparison } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const rows = await fetchComparison();
    return NextResponse.json(
      { rows, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
    );
  } catch (err) {
    console.error('[/api/comparison]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
