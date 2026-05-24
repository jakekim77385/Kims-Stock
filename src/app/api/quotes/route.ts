// GET /api/quotes?tickers=AAPL,MSFT,GOOGL,...
import { NextResponse } from 'next/server';
import { fetchQuotes } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

// 기본 종목 유니버스 (스크리너용)
const DEFAULT_TICKERS = [
  'AAPL','MSFT','GOOGL','NVDA','META','BRK-B','JNJ','V',
  'AMZN','TSLA','JPM','KO','COST','UNH','ABBV',
  'NFLX','AVGO','MA','HD','PG','XOM','LLY','MRK','CRM',
  'AMD','INTC','QCOM','NOW','ADBE','ORCL',
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tickerParam = searchParams.get('tickers');

  const tickers = tickerParam
    ? tickerParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_TICKERS;

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'tickers required' }, { status: 400 });
  }
  if (tickers.length > 50) {
    return NextResponse.json({ error: 'max 50 tickers' }, { status: 400 });
  }

  try {
    const quotes = await fetchQuotes(tickers);

    return NextResponse.json(
      { quotes, count: quotes.length, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[/api/quotes]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
