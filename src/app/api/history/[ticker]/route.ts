// GET /api/history/[ticker]?period=6mo
import { NextResponse } from 'next/server';
import { fetchHistory, type HistoryPeriod } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

const VALID_PERIODS: HistoryPeriod[] = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(req.url);
  const period = (searchParams.get('period') ?? '6mo') as HistoryPeriod;

  if (!ticker) {
    return NextResponse.json({ error: 'ticker required' }, { status: 400 });
  }
  if (!VALID_PERIODS.includes(period)) {
    return NextResponse.json(
      { error: `period must be one of: ${VALID_PERIODS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const bars = await fetchHistory(ticker.toUpperCase(), period);

    if (!bars.length) {
      return NextResponse.json({ error: `No history for ${ticker}` }, { status: 404 });
    }

    // 기간별 캐시 제어
    const maxAge = period === '1mo' ? 300 : period === '3mo' ? 900 : 3600;

    return NextResponse.json(
      { ticker: ticker.toUpperCase(), period, bars, count: bars.length, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=60`,
        },
      }
    );
  } catch (err) {
    console.error(`[/api/history/${ticker}]`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
