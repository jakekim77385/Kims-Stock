// GET /api/market — 실시간 시장 지수
import { NextResponse } from 'next/server';
import { fetchMarketIndices } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const indices = await fetchMarketIndices();

    if (!indices.length) {
      return NextResponse.json({ error: 'No data' }, { status: 503 });
    }

    return NextResponse.json(
      { indices, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[/api/market]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
