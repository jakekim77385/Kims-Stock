// GET /api/market — 실시간 시장 지수
import { NextResponse } from 'next/server';
import { fetchMarketIndices, fetchMarketNewsAndSummary } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const indices = await fetchMarketIndices();

    if (!indices.length) {
      return NextResponse.json({ error: 'No data' }, { status: 503 });
    }

    // 실시간 마켓 주요 뉴스 & 국문 요약 패칭
    let newsSummary: any = { news: [], summary: '', keyIssues: [] };
    try {
      newsSummary = await fetchMarketNewsAndSummary(indices);
    } catch (err) {
      console.error('[/api/market] Failed to fetch news and summary:', err);
    }

    return NextResponse.json(
      { 
        indices, 
        news: newsSummary.news,
        summary: newsSummary.summary,
        keyIssues: newsSummary.keyIssues,
        updatedAt: new Date().toISOString() 
      },
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
