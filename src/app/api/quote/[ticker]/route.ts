// GET /api/quote/[ticker] — 단일 종목 실시간 시세
import { NextResponse } from 'next/server';
import { fetchQuote } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }

  try {
    const quote = await fetchQuote(ticker.toUpperCase(), true);

    if (!quote) {
      return NextResponse.json({ error: `No data for ${ticker}` }, { status: 404 });
    }

    return NextResponse.json(
      { quote, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error(`[/api/quote/${ticker}]`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
