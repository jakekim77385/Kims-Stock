// GET /api/sectors — 미국증시 11개 섹터 실시간 분석
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YFClass = (require('yahoo-finance2') as { default: new (opts?: object) => typeof import('yahoo-finance2').default }).default;
const yf = new YFClass({ suppressNotices: ['yahooSurvey'] }) as any;

let cache: { data: SectorData; expiresAt: number } | null = null;

export interface SectorItem {
  symbol:      string;
  name:        string;
  nameKo:      string;
  price:       number;
  changePct:   number;   // 일간
  ytd:         number;   // 52주 수익률
  high52w:     number;
  low52w:      number;
  rangePos:    number;   // 52주 위치 0-100
  relToSpx:    number;   // S&P 500 대비 초과수익 (ytd - spxYtd)
  cycle:       'early' | 'mid' | 'late' | 'recession';  // 경기 사이클 특성
  cycleLabel:  string;
}

export interface SectorData {
  sectors:    SectorItem[];
  spxYtd:     number;
  spxChange:  number;
  dominantCycle: string;
  cycleSignal:   string;
  updatedAt:  string;
}

const SECTORS = [
  { symbol: 'XLK',  nameKo: '기술',       cycle: 'mid'       as const, cycleLabel: '경기 확장기 유리' },
  { symbol: 'XLC',  nameKo: '커뮤니케이션', cycle: 'mid'       as const, cycleLabel: '경기 확장기 유리' },
  { symbol: 'XLY',  nameKo: '임의소비재',  cycle: 'early'     as const, cycleLabel: '경기 회복 초기 유리' },
  { symbol: 'XLF',  nameKo: '금융',       cycle: 'early'     as const, cycleLabel: '경기 회복 초기 유리' },
  { symbol: 'XLI',  nameKo: '산업재',     cycle: 'early'     as const, cycleLabel: '경기 회복 초기 유리' },
  { symbol: 'XLB',  nameKo: '소재',       cycle: 'late'      as const, cycleLabel: '경기 후반기 유리' },
  { symbol: 'XLE',  nameKo: '에너지',     cycle: 'late'      as const, cycleLabel: '경기 후반기 유리' },
  { symbol: 'XLV',  nameKo: '헬스케어',   cycle: 'recession' as const, cycleLabel: '방어 / 침체기 유리' },
  { symbol: 'XLP',  nameKo: '필수소비재', cycle: 'recession' as const, cycleLabel: '방어 / 침체기 유리' },
  { symbol: 'XLU',  nameKo: '유틸리티',   cycle: 'recession' as const, cycleLabel: '방어 / 침체기 유리' },
  { symbol: 'XLRE', nameKo: '부동산',     cycle: 'recession' as const, cycleLabel: '금리 하락기 유리' },
];

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data);
  }

  // S&P 500 기준선
  const spxQ = await yf.quote('^GSPC').catch(() => null);
  const spxYtd   = spxQ?.fiftyTwoWeekChangePercent ?? 0;
  const spxChange = spxQ?.regularMarketChangePercent ?? 0;

  // 11개 섹터 동시 조회
  const results = await Promise.allSettled(
    SECTORS.map(s => yf.quote(s.symbol))
  );

  const sectors: SectorItem[] = results.map((r, i) => {
    const meta = SECTORS[i];
    if (r.status !== 'fulfilled' || !r.value) {
      return {
        symbol: meta.symbol, name: meta.symbol, nameKo: meta.nameKo,
        price: 0, changePct: 0, ytd: 0, high52w: 0, low52w: 0,
        rangePos: 50, relToSpx: 0,
        cycle: meta.cycle, cycleLabel: meta.cycleLabel,
      };
    }
    const q      = r.value;
    const price  = q.regularMarketPrice ?? 0;
    const high52 = q.fiftyTwoWeekHigh   ?? 0;
    const low52  = q.fiftyTwoWeekLow    ?? 0;
    const range  = high52 - low52;
    const rangePos = range > 0
      ? Math.max(0, Math.min(100, Math.round(((price - low52) / range) * 100)))
      : 50;
    const ytd = q.fiftyTwoWeekChangePercent ?? 0;

    return {
      symbol:    meta.symbol,
      name:      q.shortName ?? meta.symbol,
      nameKo:    meta.nameKo,
      price,
      changePct: q.regularMarketChangePercent ?? 0,
      ytd,
      high52w:   high52,
      low52w:    low52,
      rangePos,
      relToSpx:  parseFloat((ytd - spxYtd).toFixed(2)),
      cycle:     meta.cycle,
      cycleLabel: meta.cycleLabel,
    };
  });

  // 지배적 사이클 판단: 상위 3 섹터의 cycle 집계
  const top3 = [...sectors].sort((a, b) => b.ytd - a.ytd).slice(0, 3);
  const cycleCount = { early: 0, mid: 0, late: 0, recession: 0 };
  top3.forEach(s => { cycleCount[s.cycle]++; });
  const dominantCycle = (Object.entries(cycleCount).sort((a, b) => b[1] - a[1])[0][0]) as keyof typeof cycleCount;

  const cycleSignalMap = {
    early:     '경기 회복 초기 — 금융·산업재·임의소비재 강세',
    mid:       '경기 확장 중반 — 기술·커뮤니케이션 주도',
    late:      '경기 후반 과열 — 에너지·소재 강세, 방어 전환 준비',
    recession: '방어/침체 국면 — 헬스케어·유틸·필수소비재 강세',
  };

  const data: SectorData = {
    sectors,
    spxYtd,
    spxChange,
    dominantCycle: dominantCycle,
    cycleSignal: cycleSignalMap[dominantCycle],
    updatedAt: new Date().toISOString(),
  };

  cache = { data, expiresAt: Date.now() + 60_000 };
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
}
