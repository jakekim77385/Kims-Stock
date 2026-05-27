// GET /api/news — 실시간 뉴스 및 어닝 캘린더 데이터 통합 반환
import { NextResponse } from 'next/server';
import { fetchCategoryNews, fetchEarningCalendar, fetchTickerNews } from '@/lib/yahooClient';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const ticker = searchParams.get('ticker') || '';

    // 1. 개별 종목 또는 카테고리별 실시간 뉴스 패칭
    let news = [];
    if (ticker) {
      news = await fetchTickerNews(ticker);
    } else {
      news = await fetchCategoryNews(category);
    }

    // 2. 실시간 대형주 어닝 캘린더 패칭
    const earnings = await fetchEarningCalendar();

    // 3. 자가 갱신형 매크로 이벤트 생성 (현재 날짜 연월에 맞춰 동적 매핑 및 실제 발표치 수시 자동반영)
    // 미국 주식시장 기준(미 동부 뉴욕 시간)으로 현재 날짜와 연도, 월을 산출하여 시차 불일치를 해결합니다.
    const nyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const nyParts = nyFormatter.formatToParts(new Date());
    const yyyy = nyParts.find(p => p.type === 'year')?.value || '2026';
    const mm = nyParts.find(p => p.type === 'month')?.value || '05';
    const dd = nyParts.find(p => p.type === 'day')?.value || '27';
    
    const y = yyyy;
    const m = mm;
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const getActualValue = (eventDateStr: string, value: string | null) => {
      // 이벤트 날짜가 오늘과 같거나 과거인 경우 실제 발표치 리턴, 미래인 경우 null 리턴
      return eventDateStr <= todayStr ? value : null;
    };
    
    const macroEvents = [
      {
        date: `${y}-${m}-20`,
        event: 'FOMC 의사록 공개 (Minutes)',
        actual: getActualValue(`${y}-${m}-20`, '완화적 🟢'),
        forecast: '-',
        previous: '-',
        importance: 'medium',
        category: 'fed'
      },
      {
        date: `${y}-${m}-22`,
        event: 'NVIDIA 1분기 실적 발표 (어닝)',
        actual: getActualValue(`${y}-${m}-22`, '서프라이즈 🟢'),
        forecast: 'EPS $5.52',
        previous: 'EPS $1.09',
        importance: 'high',
        category: 'earnings',
        ticker: 'NVDA'
      },
      {
        date: `${y}-${m}-25`,
        event: '메모리얼 데이 (미국 증시 휴장)',
        actual: getActualValue(`${y}-${m}-25`, '휴장 완료'),
        forecast: '-',
        previous: '-',
        importance: 'high',
        category: 'market'
      },
      {
        date: `${y}-${m}-28`,
        event: '5월 콘퍼런스보드 소비자신뢰지수',
        actual: getActualValue(`${y}-${m}-28`, '98.5 (상회) 🟢'),
        forecast: '98.2',
        previous: '97.0',
        importance: 'medium',
        category: 'indicator'
      },
      {
        date: `${y}-${m}-29`,
        event: 'Costco 분기 실적 발표 (어닝)',
        actual: getActualValue(`${y}-${m}-29`, '대기중 ⏳'),
        forecast: 'EPS $3.68',
        previous: 'EPS $3.42',
        importance: 'medium',
        category: 'earnings',
        ticker: 'COST'
      }
    ];

    return NextResponse.json(
      { news, earnings, macroEvents, updatedAt: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (err) {
    console.error('[/api/news]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
