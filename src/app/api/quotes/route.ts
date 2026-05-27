// GET /api/quotes?tickers=AAPL,MSFT,GOOGL,...
import { NextResponse } from 'next/server';
import { fetchQuotes, fetchHistory } from '@/lib/yahooClient';

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
    const includeFundamentals = searchParams.get('includeFundamentals') === 'true';
    const quotes = await fetchQuotes(tickers, includeFundamentals);
    
    const include1w = searchParams.get('include1w') === 'true';
    let results = quotes as any[];
    
    if (include1w) {
      const with1w = await Promise.all(
        quotes.map(async (q) => {
          try {
            const bars = await fetchHistory(q.ticker, '1mo');
            if (bars && bars.length > 0) {
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() - 7);
              
              let closestBar = bars[0];
              let minDiff = Infinity;
              
              for (const bar of bars) {
                const barTime = new Date(bar.date).getTime();
                const diff = Math.abs(barTime - targetDate.getTime());
                if (diff < minDiff) {
                  minDiff = diff;
                  closestBar = bar;
                }
              }
              
              if (closestBar && closestBar.close > 0) {
                const change1wPct = ((q.price - closestBar.close) / closestBar.close) * 100;
                return {
                  ...q,
                  change1wPct: parseFloat(change1wPct.toFixed(2)),
                  price1wAgo: closestBar.close
                };
              }
            }
          } catch (e) {
            console.error(`Failed to calc 1w change for ${q.ticker}`, e);
          }
          return { ...q, change1wPct: null, price1wAgo: null };
        })
      );
      results = with1w;
    }

    return NextResponse.json(
      { quotes: results, count: results.length, updatedAt: new Date().toISOString() },
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
