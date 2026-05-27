// Utility helper functions
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(decimals)}`;
}

export function formatMarketCap(value: number): string {
  // value in millions
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}T`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}B`;
  return `$${value.toFixed(0)}M`;
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function getChangeBg(value: number): string {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400';
  if (value < 0) return 'bg-red-400/10 text-red-400';
  return 'bg-slate-400/10 text-slate-400';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getRSISignal(rsi: number): { label: string; color: string } {
  if (rsi >= 70) return { label: '과매수', color: 'text-red-400' };
  if (rsi <= 30) return { label: '과매도', color: 'text-emerald-400' };
  return { label: '중립', color: 'text-slate-400' };
}

export function calcPortfolioMetrics(positions: {
  shares: number;
  avgCost: number;
  currentPrice: number;
}[]) {
  const totalCost = positions.reduce((sum, p) => sum + p.shares * p.avgCost, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  return { totalCost, totalValue, totalGain, totalGainPct };
}

// Sharpe Ratio approximation (simplified)
export function calcSharpeRatio(returnPct: number, volatility: number = 15): number {
  const riskFreeRate = 5.25; // current risk-free rate
  return (returnPct - riskFreeRate) / volatility;
}

// Max Drawdown calculation
export function calcMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];
  for (const price of prices) {
    if (price > peak) peak = price;
    const drawdown = ((peak - price) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}

// DCF Valuation
export function calcDCF(params: {
  fcfPerShare: number;
  growthRate: number;
  terminalGrowth: number;
  discountRate: number;
  years: number;
}): number {
  const { fcfPerShare, growthRate, terminalGrowth, discountRate, years } = params;
  let intrinsicValue = 0;
  let fcf = fcfPerShare;
  for (let y = 1; y <= years; y++) {
    fcf = fcf * (1 + growthRate / 100);
    intrinsicValue += fcf / Math.pow(1 + discountRate / 100, y);
  }
  // Terminal value
  const terminalFCF = fcf * (1 + terminalGrowth / 100);
  const terminalValue = terminalFCF / (discountRate / 100 - terminalGrowth / 100);
  intrinsicValue += terminalValue / Math.pow(1 + discountRate / 100, years);
  return Math.round(intrinsicValue * 100) / 100;
}

// CANSLIM Score
export function calcCANSLIM(stock: {
  cEpsGrowthQtr: number;
  aEpsGrowth3y: number;
  nNewHigh: boolean;
  sVolumeSurge: number;
  iInstitOwnership: number;
  rs52w: number;
}): number {
  let score = 0;
  // C: Current quarterly EPS > 25%
  if (stock.cEpsGrowthQtr >= 25) score += 20;
  else if (stock.cEpsGrowthQtr >= 15) score += 12;
  // A: Annual EPS growth 3yr > 15%
  if (stock.aEpsGrowth3y >= 20) score += 20;
  else if (stock.aEpsGrowth3y >= 15) score += 12;
  // N: Near 52-week high
  if (stock.nNewHigh) score += 15;
  // S: Volume surge on breakout
  if (stock.sVolumeSurge >= 1.4) score += 15;
  else if (stock.sVolumeSurge >= 1.2) score += 8;
  // I: Institutional ownership
  if (stock.iInstitOwnership >= 70) score += 15;
  else if (stock.iInstitOwnership >= 50) score += 8;
  // M/L: RS Rating
  if (stock.rs52w >= 90) score += 15;
  else if (stock.rs52w >= 80) score += 10;
  return score;
}

// ─── 한국어 종목명 ➡️ 영어 티커 매핑 ──────────────────────────────────────────
export const KOREAN_STOCK_MAP: Record<string, string> = {
  '애플': 'AAPL',
  '마소': 'MSFT',
  '마이크로소프트': 'MSFT',
  '구글': 'GOOGL',
  '알파벳': 'GOOGL',
  '엔비디아': 'NVDA',
  '테슬라': 'TSLA',
  '아마존': 'AMZN',
  '메타': 'META',
  '페이스북': 'META',
  '넷플릭스': 'NFLX',
  '코카콜라': 'KO',
  '스타벅스': 'SBUX',
  '스벅': 'SBUX',
  '맥도날드': 'MCD',
  '맥도': 'MCD',
  '코스트코': 'COST',
  '유나이티드헬스': 'UNH',
  '유나이티드 헬스': 'UNH',
  '애브비': 'ABBV',
  '존슨앤존슨': 'JNJ',
  '존슨앤드존슨': 'JNJ',
  '비자': 'V',
  '마스터카드': 'MA',
  '제이피모건': 'JPM',
  'jp모건': 'JPM',
  '일라이릴리': 'LLY',
  '일라이 릴리': 'LLY',
  '브로드컴': 'AVGO',
  '어도비': 'ADBE',
  '인텔': 'INTC',
  '퀄컴': 'QCOM',
  '암': 'ARM',
  '팔란티어': 'PLTR',
  '아이온큐': 'IONQ',
  '소파이': 'SOFI',
  '슈퍼마이크로': 'SMCI',
  '마이크론': 'MU',
  '코인베이스': 'COIN',
  '디즈니': 'DIS',
  '나이키': 'NKE',
  '홈디포': 'HD',
  '펩시': 'PEP',
  '엑슨모빌': 'XOM',
  '셰브론': 'CVX',
  '쉐브론': 'CVX',
  '버라이즌': 'VZ',
  '캐터필러': 'CAT',
  '포드': 'F',
  '지엠': 'GM',
  '보잉': 'BA',
  '넷플': 'NFLX',
  '쿠팡': 'CPNG',
  '에이엠디': 'AMD',
  '아이에스엠엘': 'ASML',
  '티에스엠씨': 'TSM',
  'tsmc': 'TSM',
  '노보노디스크': 'NVO',
  '릴리': 'LLY',
};

// ─── 한국어 종목명을 영어 티커로 변환하는 헬퍼 ─────────────────────────────────────
export function resolveTicker(ticker: string): string {
  if (!ticker) return ticker;
  let clean = ticker.trim().toUpperCase();
  
  // Convert dot symbols to dash symbols for Yahoo Finance compatibility (e.g., BRK.B -> BRK-B, BF.B -> BF-B)
  if (clean.includes('.')) {
    clean = clean.replace(/\./g, '-');
  }

  const lower = clean.toLowerCase();

  // 한국어 매핑 탐색 (완전 일치 또는 포함 관계)
  const matchKey = Object.keys(KOREAN_STOCK_MAP).find(
    (k) => k === lower || k.includes(lower) || lower.includes(k)
  );

  return matchKey ? KOREAN_STOCK_MAP[matchKey] : clean;
}

