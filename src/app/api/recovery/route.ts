// GET /api/recovery — 저평가 자산 반등 추정 분석
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YFClass = (require('yahoo-finance2') as { default: new (opts?: object) => typeof import('yahoo-finance2').default }).default;
const yf = new YFClass({ suppressNotices: ['yahooSurvey'] }) as any;

let cache: { data: RecoveryAsset[]; expiresAt: number } | null = null;

export interface RecoveryAsset {
  symbol:      string;
  name:        string;
  category:    string;
  color:       string;
  price:       number;
  high52w:     number;
  low52w:      number;
  rangePos:    number;
  // 상승 목표 (저평가용)
  targetMid:   number;   // 52주 중간값
  targetHigh:  number;   // 52주 고점
  returnToMid:  number;  // 중간값까지 % (저평가=양수, 고평가=음수)
  returnToHigh: number;  // 고점까지 %
  monthsToMid:    number;
  monthsToHigh:   number;
  annualizedMid:  number;
  annualizedHigh: number;
  // 하락 목표 (고평가용)
  targetLow:      number;  // 52주 저점
  returnToLow:    number;  // 52주 저점까지 % (음수)
  monthsToLow:    number;  // 예상 기간
  annualizedLow:  number;  // 연간 하락률 (음수)
  // 변동성
  annualVol:    number;
  monthlyDrift: number;
  confidence:     'high' | 'medium' | 'low';
  confidenceNote: string;
  maxDrawdown:  number;
  currency:     string;
}

const TARGETS = [
  { symbol: '^GSPC',    name: 'S&P 500',       category: '미국증시', color: '#1a56db' },
  { symbol: '^IXIC',    name: 'NASDAQ',         category: '미국증시', color: '#1a56db' },
  { symbol: '^DJI',     name: 'Dow Jones',      category: '미국증시', color: '#1a56db' },
  { symbol: '^RUT',     name: 'Russell 2000',   category: '미국증시', color: '#1a56db' },
  { symbol: 'XLK',     name: '기술 ETF',        category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLF',     name: '금융 ETF',        category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLE',     name: '에너지 ETF',      category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLV',     name: '헬스케어 ETF',    category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLI',     name: '산업재 ETF',      category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLP',     name: '필수소비재 ETF',  category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLY',     name: '임의소비재 ETF',  category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLU',     name: '유틸리티 ETF',    category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLRE',    name: '부동산 ETF',      category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLB',     name: '소재 ETF',        category: '섹터ETF',  color: '#7c3aed' },
  { symbol: 'XLC',     name: '커뮤니케이션ETF', category: '섹터ETF',  color: '#7c3aed' },
  { symbol: '^KS11',   name: 'KOSPI',           category: '글로벌',   color: '#e11d48' },
  { symbol: '^N225',   name: '닛케이 225',      category: '글로벌',   color: '#d97706' },
  { symbol: '^GDAXI',  name: 'DAX',             category: '글로벌',   color: '#0891b2' },
  { symbol: '000001.SS',name:'상해종합',         category: '글로벌',   color: '#dc2626' },
  { symbol: '^NSEI',   name: 'Nifty50',         category: '글로벌',   color: '#f97316' },
  { symbol: '^STOXX50E',name:'STOXX50',          category: '글로벌',   color: '#0891b2' },
  { symbol: '^BVSP',   name: '보베스파',         category: '글로벌',   color: '#16803c' },
  { symbol: '^AXJO',   name: 'ASX200',           category: '글로벌',   color: '#0284c7' },
  { symbol: '^TWII',   name: '대만 가권',        category: '글로벌',   color: '#7c3aed' },
  { symbol: 'TLT',     name: '미국 20Y 채권',   category: '채권',     color: '#0891b2' },
  { symbol: 'HYG',     name: '하이일드',         category: '채권',     color: '#0891b2' },
  { symbol: 'EMB',     name: '신흥국채권',       category: '채권',     color: '#0891b2' },
  { symbol: 'GC=F',    name: '금 (Gold)',        category: '원자재',   color: '#b45309' },
  { symbol: 'SI=F',    name: '은 (Silver)',      category: '원자재',   color: '#6b7280' },
  { symbol: 'HG=F',    name: '구리 (Copper)',    category: '원자재',   color: '#b45309' },
  { symbol: 'CL=F',    name: 'WTI 원유',        category: '원자재',   color: '#374151' },
  { symbol: 'PA=F',    name: '팔라듐',           category: '원자재',   color: '#6b7280' },
  { symbol: 'PL=F',    name: '플래티넘',         category: '원자재',   color: '#6b7280' },
  { symbol: 'BTC-USD', name: 'Bitcoin',          category: '암호화폐', color: '#f59e0b' },
  { symbol: 'ETH-USD', name: 'Ethereum',         category: '암호화폐', color: '#6366f1' },
] as const;

// 히스토리로 변동성 계산
async function calcVolatility(symbol: string): Promise<{ annualVol: number; monthlyDrift: number; maxDrawdown: number }> {
  try {
    const end   = new Date();
    const start = new Date(); start.setFullYear(start.getFullYear() - 1);
    const hist  = await yf.historical(symbol, { period1: start, interval: '1wk' });
    if (hist.length < 10) return { annualVol: 25, monthlyDrift: 0.5, maxDrawdown: -15 };

    const closes = hist.map((d: any) => d.close ?? 0).filter((c: any) => c > 0);
    if (closes.length < 4) return { annualVol: 25, monthlyDrift: 0.5, maxDrawdown: -15 };

    // 주간 수익률
    const weeklyRets: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      weeklyRets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const mean   = weeklyRets.reduce((s, r) => s + r, 0) / weeklyRets.length;
    const variance = weeklyRets.reduce((s, r) => s + (r - mean) ** 2, 0) / weeklyRets.length;
    const weeklyVol = Math.sqrt(variance);

    // 연환산
    const annualVol    = weeklyVol * Math.sqrt(52) * 100;
    const monthlyDrift = mean * 4.33 * 100; // 주 → 월

    // 최대 낙폭 (1년)
    let peak = closes[0];
    let maxDD = 0;
    for (const c of closes) {
      if (c > peak) peak = c;
      const dd = (c - peak) / peak * 100;
      if (dd < maxDD) maxDD = dd;
    }

    return {
      annualVol:    parseFloat(annualVol.toFixed(1)),
      monthlyDrift: parseFloat(monthlyDrift.toFixed(2)),
      maxDrawdown:  parseFloat(maxDD.toFixed(1)),
    };
  } catch {
    return { annualVol: 25, monthlyDrift: 0.5, maxDrawdown: -15 };
  }
}

// 예상 기간 (개월) 추정 — absReturn은 절대값으로 전달
function estimateMonths(absReturn: number, monthlyDrift: number, annualVol: number): number {
  if (absReturn <= 0) return 0;
  const baseDrift = Math.abs(monthlyDrift) > 0.1 ? Math.abs(monthlyDrift) : (annualVol * 0.35) / 12;
  const raw = absReturn / baseDrift;
  return Math.max(1, Math.min(60, parseFloat(raw.toFixed(1))));
}

// 신뢰도 판정
function getConfidence(rangePos: number, annualVol: number, maxDrawdown: number): { confidence: 'high'|'medium'|'low'; note: string } {
  // 저평가 + 변동성 낮음 = 신뢰도 높음
  if (rangePos <= 25 && annualVol < 30 && maxDrawdown > -20)
    return { confidence: 'high',   note: '역사적 저점 + 낮은 변동성' };
  if (rangePos <= 40 && annualVol < 50)
    return { confidence: 'medium', note: '저평가 구간, 변동성 주의' };
  if (annualVol >= 60)
    return { confidence: 'low',    note: '고변동성 — 단기 추가 하락 가능' };
  return   { confidence: 'medium', note: '중립적 회귀 가능성' };
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json({ assets: cache.data, updatedAt: new Date().toISOString() });
  }

  // 시세 조회
  const quotes = await Promise.allSettled(
    TARGETS.map((t) => yf.quote(t.symbol))
  );

  // 저평가 자산 (rangePos < 70) 먼저 추림 → 변동성은 해당 자산만 계산
  const priceData = quotes.map((r, i) => {
    const meta = TARGETS[i];
    if (r.status !== 'fulfilled' || !r.value) return null;
    const q       = r.value;
    const price   = q.regularMarketPrice ?? 0;
    const high52w = q.fiftyTwoWeekHigh   ?? 0;
    const low52w  = q.fiftyTwoWeekLow    ?? 0;
    const range   = high52w - low52w;
    const rangePos = range > 0 ? Math.max(0, Math.min(100, Math.round(((price - low52w) / range) * 100))) : 50;
    return { ...meta, price, high52w, low52w, rangePos, currency: q.currency ?? 'USD' };
  }).filter(Boolean) as (typeof TARGETS[number] & { price: number; high52w: number; low52w: number; rangePos: number; currency: string })[];

  // 병렬 변동성 계산 (전체 — 60초 캐시라 API 부하 분산됨)
  const volData = await Promise.allSettled(
    priceData.map((a) => calcVolatility(a.symbol))
  );

  const assets: RecoveryAsset[] = priceData.map((a, i) => {
    const vol = volData[i].status === 'fulfilled' ? volData[i].value : { annualVol: 25, monthlyDrift: 0.5, maxDrawdown: -15 };
    const { annualVol, monthlyDrift, maxDrawdown } = vol;

    const targetMid  = (a.high52w + a.low52w) / 2;
    const targetHigh = a.high52w;
    const targetLow  = a.low52w;

    const returnToMid  = a.price > 0 ? parseFloat(((targetMid  - a.price) / a.price * 100).toFixed(2)) : 0;
    const returnToHigh = a.price > 0 ? parseFloat(((targetHigh - a.price) / a.price * 100).toFixed(2)) : 0;
    const returnToLow  = a.price > 0 ? parseFloat(((targetLow  - a.price) / a.price * 100).toFixed(2)) : 0;

    // 상승 추정 (저평가용)
    const monthsToMid  = returnToMid  > 0 ? estimateMonths(returnToMid,  monthlyDrift, annualVol) : 0;
    const monthsToHigh = returnToHigh > 0 ? estimateMonths(returnToHigh, monthlyDrift, annualVol) : 0;
    const annualizedMid  = (monthsToMid  > 0 && returnToMid  > 0)
      ? parseFloat((((1 + returnToMid  / 100) ** (12 / monthsToMid)  - 1) * 100).toFixed(1)) : 0;
    const annualizedHigh = (monthsToHigh > 0 && returnToHigh > 0)
      ? parseFloat((((1 + returnToHigh / 100) ** (12 / monthsToHigh) - 1) * 100).toFixed(1)) : 0;

    // 하락 추정 (고평가용) — returnToMid가 음수이면 중간값이 아래에 있음
    const declineToMid = returnToMid < 0 ? Math.abs(returnToMid) : 0;  // 중간값까지 하락폭
    const declineToLow = returnToLow < 0 ? Math.abs(returnToLow) : 0;  // 52주 저점까지 하락폭
    const monthsToLow = declineToLow > 0 ? estimateMonths(declineToLow, annualVol * 0.5 / 12, annualVol) : 0;
    const annualizedLow = (monthsToLow > 0 && declineToLow > 0)
      ? parseFloat((-((1 + declineToLow / 100) ** (12 / monthsToLow) - 1) * 100).toFixed(1)) : 0;

    const { confidence, note: confidenceNote } = getConfidence(a.rangePos, annualVol, maxDrawdown);

    return {
      symbol: a.symbol, name: a.name, category: a.category, color: a.color,
      price: a.price, high52w: a.high52w, low52w: a.low52w, rangePos: a.rangePos,
      targetMid, targetHigh, targetLow,
      returnToMid, returnToHigh, returnToLow,
      monthsToMid, monthsToHigh, monthsToLow,
      annualizedMid, annualizedHigh, annualizedLow,
      annualVol, monthlyDrift,
      confidence, confidenceNote, maxDrawdown,
      currency: a.currency,
    };
  });

  // 저평가 순 정렬
  assets.sort((a, b) => a.rangePos - b.rangePos);

  cache = { data: assets, expiresAt: Date.now() + 60_000 };
  return NextResponse.json(
    { assets, updatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=60' } }
  );
}
