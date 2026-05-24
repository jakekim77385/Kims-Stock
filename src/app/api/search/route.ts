// GET /api/search?q=apple — 종목 검색 자동완성
import { NextResponse } from 'next/server';
import { searchTickers } from '@/lib/yahooClient';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTickers(q);
    return NextResponse.json(
      { results, query: q },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
        },
      }
    );
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
