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
