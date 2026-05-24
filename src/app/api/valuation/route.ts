// GET /api/valuation — 전체 자산 상대 저평가 비교
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YFClass = (require('yahoo-finance2') as { default: new (opts?: object) => typeof import('yahoo-finance2').default }).default;
const yf = new YFClass({ suppressNotices: ['yahooSurvey'] }) as any;

let cache: { data: ValuationAsset[]; expiresAt: number } | null = null;

export interface ValuationAsset {
  symbol:    string;
  name:      string;
  category:  string;
  color:     string;
  price:     number;
  changePct: number;
  high52w:   number;
  low52w:    number;
  rangePos:  number;   // 0~100 (낮을수록 저평가)
  fromHigh:  number;   // 52주 고점 대비 %
  ytd:       number;   // 52주 수익률
  currency:  string;
  derived?:  boolean;  // 계산값 여부
  note?:     string;   // 부가 설명
}

// ─── 직접 조회 자산 ──────────────────────────────────────────────────────────
const DIRECT_ASSETS = [
  // 미국증시
  { symbol: '^GSPC',     name: 'S&P 500',       category: '미국증시', color: '#1a56db' },
  { symbol: '^IXIC',     name: 'NASDAQ',         category: '미국증시', color: '#1a56db' },
  { symbol: '^DJI',      name: 'Dow Jones',      category: '미국증시', color: '#1a56db' },
  { symbol: '^RUT',      name: 'Russell 2000',   category: '미국증시', color: '#1a56db' },
  // 섹터 ETF
  { symbol: 'XLK',  name: '기술 (Tech)',         category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLF',  name: '금융 (Finance)',      category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLE',  name: '에너지 (Energy)',     category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLV',  name: '헬스케어',            category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLI',  name: '산업재',              category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLP',  name: '필수소비재',          category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLY',  name: '임의소비재',          category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLU',  name: '유틸리티',            category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLRE', name: '부동산 (REIT)',        category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLB',  name: '소재 (Materials)',    category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLC',  name: '커뮤니케이션',        category: '섹터ETF',  color: '#7c3aed' },
  // 글로벌증시
  { symbol: '^KS11',      name: 'KOSPI',         category: '글로벌',   color: '#e11d48' },
  { symbol: '^N225',      name: '닛케이 225',    category: '글로벌',   color: '#d97706' },
  { symbol: '^GDAXI',     name: 'DAX (독일)',    category: '글로벌',   color: '#0891b2' },
  { symbol: '000001.SS',  name: '상해 (중국)',   category: '글로벌',   color: '#dc2626' },
  { symbol: '^NSEI',      name: 'Nifty50 (인도)',category: '글로벌',   color: '#f97316' },
  { symbol: '^STOXX50E',  name: 'STOXX50 (유럽)',category: '글로벌',   color: '#0891b2' },
  { symbol: '^BVSP',      name: '보베스파 (브라질)',category:'글로벌',  color: '#16803c' },
  { symbol: '^AXJO',      name: 'ASX200 (호주)', category: '글로벌',   color: '#0284c7' },
  { symbol: '^TWII',      name: '가권 (대만)',   category: '글로벌',   color: '#7c3aed' },
  // 채권 ETF
  { symbol: 'TLT',  name: '미국20Y 채권 TLT',   category: '채권',     color: '#0891b2' },
  { symbol: 'HYG',  name: '하이일드 HYG',        category: '채권',     color: '#0891b2' },
  { symbol: 'EMB',  name: '신흥국채권 EMB',      category: '채권',     color: '#0891b2' },
  // 원자재
  { symbol: 'GC=F', name: '금 (Gold)',           category: '원자재',   color: '#b45309' },
  { symbol: 'SI=F', name: '은 (Silver)',         category: '원자재',   color: '#6b7280' },
  { symbol: 'HG=F', name: '구리 (Copper)',       category: '원자재',   color: '#b45309' },
  { symbol: 'CL=F', name: 'WTI 원유',           category: '원자재',   color: '#374151' },
  { symbol: 'PA=F', name: '팔라듐',             category: '원자재',   color: '#6b7280' },
  { symbol: 'PL=F', name: '플래티넘',           category: '원자재',   color: '#6b7280' },
  // 암호화폐
  { symbol: 'BTC-USD', name: 'Bitcoin',         category: '암호화폐', color: '#f59e0b' },
  { symbol: 'ETH-USD', name: 'Ethereum',        category: '암호화폐', color: '#6366f1' },
] as const;

async function fetchOne(symbol: string) {
  try { return await yf.quote(symbol); } catch { return null; }
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json({ assets: cache.data, updatedAt: new Date().toISOString() });
  }

  // 병렬 조회
  const raw = await Promise.allSettled(
    DIRECT_ASSETS.map((a) => fetchOne(a.symbol))
  );

  const priceMap: Record<string, number> = {};
  const assets: ValuationAsset[] = raw.map((r, i) => {
    const meta = DIRECT_ASSETS[i];
    const base: ValuationAsset = {
      symbol: meta.symbol, name: meta.name,
      category: meta.category, color: meta.color,
      price: 0, changePct: 0, high52w: 0, low52w: 0,
      rangePos: 50, fromHigh: 0, ytd: 0, currency: 'USD',
    };
    if (r.status === 'fulfilled' && r.value) {
      const q = r.value;
      const price   = q.regularMarketPrice ?? 0;
      const high52w = q.fiftyTwoWeekHigh   ?? 0;
      const low52w  = q.fiftyTwoWeekLow    ?? 0;
      const range   = high52w - low52w;
      const rangePos = range > 0
        ? Math.round(((price - low52w) / range) * 100)
        : 50;
      priceMap[meta.symbol] = price;
      return {
        ...base,
        price,
        changePct: q.regularMarketChangePercent  ?? 0,
        high52w, low52w,
        rangePos: Math.max(0, Math.min(100, rangePos)),
        fromHigh: high52w > 0 ? parseFloat((((price - high52w) / high52w) * 100).toFixed(2)) : 0,
        ytd:      parseFloat((q.fiftyTwoWeekChangePercent ?? q.regularMarketChangePercent ?? 0).toFixed(2)),
        currency: q.currency ?? 'USD',
      };
    }
    return base;
  });

  // ─── 파생 지표 계산 ───────────────────────────────────────────────────────
  const gold   = priceMap['GC=F']  ?? 0;
  const silver = priceMap['SI=F']  ?? 0;
  const copper = priceMap['HG=F']  ?? 0;
  const tnx    = priceMap['^TNX']  ?? 0;   // ^TNX는 direct 목록에 없지만 혹시 대비
  // IRX(2Y)는 별도 조회
  let irx = 0;
  try { const q2 = await yf.quote('^IRX'); irx = q2?.regularMarketPrice ?? 0; } catch { /**/ }

  const DERIVED: ValuationAsset[] = [
    {
      symbol: 'GOLD_SILVER', name: '금은비 (Gold/Silver)',
      category: '파생지표', color: '#b45309',
      price:     silver > 0 ? parseFloat((gold / silver).toFixed(2)) : 0,
      changePct: 0, high52w: 110, low52w: 65,
      rangePos:  silver > 0 ? Math.max(0, Math.min(100, Math.round(((gold / silver - 65) / (110 - 65)) * 100))) : 50,
      fromHigh:  0, ytd: 0, currency: '',
      derived: true,
      note: '80↑ 은 저평가 · 65↓ 금 저평가',
    },
    {
      symbol: 'COPPER_GOLD', name: '구리/금 비율',
      category: '파생지표', color: '#b45309',
      price:     gold > 0 ? parseFloat((copper / gold).toFixed(6)) : 0,
      changePct: 0, high52w: 0.00055, low52w: 0.00020,
      rangePos:  gold > 0
        ? Math.max(0, Math.min(100, Math.round(((copper / gold - 0.00020) / (0.00055 - 0.00020)) * 100)))
        : 50,
      fromHigh:  0, ytd: 0, currency: '',
      derived: true,
      note: '높을수록 경기 낙관 · 낮을수록 경기 비관',
    },
    {
      symbol: 'YIELD_SPREAD', name: '장단기 금리차 (10Y-2Y)',
      category: '파생지표', color: '#0891b2',
      // IRX는 13주(3M) 물인데 2Y 근사치로 사용 (^IRX = 13주 T-Bill rate)
      price:     parseFloat((tnx - irx * 0.1).toFixed(3)),
      changePct: 0, high52w: 2.0, low52w: -1.5,
      rangePos:  50,  // 스프레드는 중립 기준이 다르므로 별도 표시
      fromHigh:  0, ytd: 0, currency: '%',
      derived: true,
      note: '음수 = 장단기 역전(경기침체 신호)',
    },
  ];

  const all = [...assets, ...DERIVED];
  cache = { data: all, expiresAt: Date.now() + 60_000 };

  return NextResponse.json(
    { assets: all, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=60' } }
  );
}
