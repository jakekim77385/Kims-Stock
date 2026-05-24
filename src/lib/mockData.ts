// Mock data engine for DH Stock platform
// Real API integration ready - replace functions with actual API calls

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  // Valuation
  pe: number;
  pb: number;
  ps: number;
  peg: number;
  evEbitda: number;
  // Quality
  roe: number;
  roa: number;
  roic: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  // Growth
  epsGrowthYoy: number;
  epsGrowth5y: number;
  revenueGrowthYoy: number;
  revenueGrowth5y: number;
  // Financial Health
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  interestCoverage: number;
  fcfYield: number;
  // Momentum
  rsi14: number;
  rs52w: number; // relative strength vs S&P500
  high52w: number;
  low52w: number;
  priceVs52wHigh: number; // % below 52w high
  ma50: number;
  ma200: number;
  // Dividend
  dividendYield: number;
  dividendGrowth5y: number;
  payoutRatio: number;
  // CANSLIM
  cEpsGrowthQtr: number; // C: Current EPS growth
  aEpsGrowth3y: number;  // A: Annual EPS growth 3yr avg
  nNewHigh: boolean;     // N: Near new high
  sVolumeSurge: number;  // S: Volume surge ratio
  iInstitOwnership: number; // I: Institutional ownership %
  // Magic Formula
  earningsYield: number;  // EBIT/EV
  returnOnCapital: number; // EBIT/(NetWorkingCapital + FixedAssets)
  magicFormulaRank: number;
  // Scores
  qualityScore: number;
  valueScore: number;
  momentumScore: number;
  growthScore: number;
  overallScore: number;
}

export interface PortfolioPosition {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  purchaseDate: string;
}

export interface MarketIndex {
  name: string;
  ticker: string;
  value: number;
  change: number;
  changePct: number;
  color: string;
}

export interface SectorData {
  sector: string;
  changePct: number;
  marketCap: number;
  pe: number;
  stocks: number;
}

export interface MacroEvent {
  date: string;
  event: string;
  actual: string | null;
  forecast: string;
  previous: string;
  importance: 'high' | 'medium' | 'low';
}

export interface LegendaryPortfolio {
  investor: string;
  title: string;
  style: string;
  holdings: { ticker: string; name: string; weight: number; action: 'Buy' | 'Hold' | 'Sell' }[];
}

// ─── Market Indices ─────────────────────────────── 2026-05-22 실제 종가 ─────
export const marketIndices: MarketIndex[] = [
  { name: 'S&P 500',      ticker: 'SPX', value: 7473.47,  change:  -39.19, changePct: -0.52, color: '#ef4444' },
  { name: 'NASDAQ',       ticker: 'COMP', value: 26293.10, change: -136.32, changePct: -0.52, color: '#ef4444' },
  { name: 'DOW JONES',    ticker: 'DJI',  value: 50579.70, change:  -81.44, changePct: -0.16, color: '#ef4444' },
  { name: 'VIX',          ticker: 'VIX',  value: 17.03,   change:    0.89,  changePct:  5.52, color: '#f59e0b' },
  { name: 'Russell 2000', ticker: 'RUT',  value: 2869.23,  change:  -11.24, changePct: -0.39, color: '#ef4444' },
  { name: '10Y Treasury', ticker: 'TNX',  value: 4.56,    change:    0.04,  changePct:  0.89, color: '#f59e0b' },
];

// ─── Sector Performance ───────────────────────────────────────────────────────
export const sectorData: SectorData[] = [
  { sector: 'Technology', changePct: 1.85, marketCap: 14200, pe: 28.4, stocks: 147 },
  { sector: 'Healthcare', changePct: 0.42, marketCap: 6800, pe: 22.1, stocks: 132 },
  { sector: 'Financials', changePct: 0.73, marketCap: 7100, pe: 13.8, stocks: 98 },
  { sector: 'Consumer Disc.', changePct: -0.31, marketCap: 5200, pe: 24.7, stocks: 84 },
  { sector: 'Industrials', changePct: 0.55, marketCap: 4800, pe: 20.3, stocks: 76 },
  { sector: 'Communication', changePct: 1.12, marketCap: 3900, pe: 17.6, stocks: 53 },
  { sector: 'Consumer Staples', changePct: -0.22, marketCap: 3400, pe: 19.2, stocks: 61 },
  { sector: 'Energy', changePct: -0.88, marketCap: 2900, pe: 11.4, stocks: 54 },
  { sector: 'Real Estate', changePct: -1.15, marketCap: 2100, pe: 35.1, stocks: 45 },
  { sector: 'Materials', changePct: 0.28, marketCap: 1900, pe: 16.8, stocks: 38 },
  { sector: 'Utilities', changePct: -0.65, marketCap: 1600, pe: 18.9, stocks: 34 },
];

// ─── Macro Events Calendar ────────────────────────────────────────────────────
export const macroEvents: MacroEvent[] = [
  { date: '2026-05-27', event: 'Memorial Day (Market Closed)', actual: null, forecast: '-', previous: '-', importance: 'high' },
  { date: '2026-05-28', event: 'Consumer Confidence', actual: null, forecast: '98.2', previous: '97.0', importance: 'medium' },
  { date: '2026-05-29', event: 'GDP Q1 (Revised)', actual: null, forecast: '2.4%', previous: '2.4%', importance: 'high' },
  { date: '2026-05-30', event: 'PCE Price Index YoY', actual: null, forecast: '2.7%', previous: '2.7%', importance: 'high' },
  { date: '2026-06-04', event: 'ISM Manufacturing PMI', actual: null, forecast: '49.8', previous: '49.2', importance: 'medium' },
  { date: '2026-06-06', event: 'Non-Farm Payrolls', actual: null, forecast: '185K', previous: '175K', importance: 'high' },
  { date: '2026-06-11', event: 'CPI YoY', actual: null, forecast: '3.3%', previous: '3.4%', importance: 'high' },
  { date: '2026-06-12', event: 'FOMC Meeting (Day 1)', actual: null, forecast: '-', previous: '-', importance: 'high' },
  { date: '2026-06-13', event: 'FOMC Rate Decision', actual: null, forecast: '5.25-5.50%', previous: '5.25-5.50%', importance: 'high' },
];

// ─── Stock Universe ───────────────────── 2026-05-22 실제 종가 기준 ───────────
export const stockUniverse: Stock[] = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics',
    price: 308.82, change: -1.94, changePct: -0.62, volume: 48200000, avgVolume: 52000000, marketCap: 4680000,
    pe: 30.8, pb: 52.4, ps: 8.2, peg: 2.3, evEbitda: 23.4,
    roe: 160.5, roa: 22.8, roic: 48.2, grossMargin: 46.5, operatingMargin: 31.2, netMargin: 25.9,
    epsGrowthYoy: 10.1, epsGrowth5y: 14.2, revenueGrowthYoy: 4.0, revenueGrowth5y: 9.8,
    debtToEquity: 185.4, currentRatio: 1.07, quickRatio: 1.02, interestCoverage: 28.1, fcfYield: 3.2,
    rsi14: 52.4, rs52w: 68, high52w: 325.00, low52w: 218.24, priceVs52wHigh: -5.0, ma50: 210.8, ma200: 230.4,
    dividendYield: 0.50, dividendGrowth5y: 5.8, payoutRatio: 15.4,
    cEpsGrowthQtr: 10.1, aEpsGrowth3y: 12.0, nNewHigh: false, sVolumeSurge: 0.93, iInstitOwnership: 61.2,
    earningsYield: 3.9, returnOnCapital: 48.2, magicFormulaRank: 48,
    qualityScore: 88, valueScore: 50, momentumScore: 58, growthScore: 62, overallScore: 66,
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', industry: 'Software',
    price: 418.57, change: -2.18, changePct: -0.52, volume: 20100000, avgVolume: 22000000, marketCap: 3110000,
    pe: 35.4, pb: 12.8, ps: 12.8, peg: 1.8, evEbitda: 26.8,
    roe: 38.2, roa: 17.1, roic: 28.4, grossMargin: 69.8, operatingMargin: 44.6, netMargin: 35.9,
    epsGrowthYoy: 22.4, epsGrowth5y: 20.8, revenueGrowthYoy: 17.6, revenueGrowth5y: 16.4,
    debtToEquity: 38.2, currentRatio: 1.28, quickRatio: 1.21, interestCoverage: 42.8, fcfYield: 2.4,
    rsi14: 58.2, rs52w: 82, high52w: 468.35, low52w: 380.23, priceVs52wHigh: -10.6, ma50: 408.2, ma200: 420.8,
    dividendYield: 0.68, dividendGrowth5y: 10.2, payoutRatio: 24.1,
    cEpsGrowthQtr: 22.4, aEpsGrowth3y: 18.4, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 71.8,
    earningsYield: 3.5, returnOnCapital: 28.4, magicFormulaRank: 36,
    qualityScore: 94, valueScore: 46, momentumScore: 72, growthScore: 88, overallScore: 80,
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication', industry: 'Internet Services',
    price: 382.97, change: -2.14, changePct: -0.56, volume: 22400000, avgVolume: 24800000, marketCap: 4720000,
    pe: 20.8, pb: 6.4, ps: 6.8, peg: 1.0, evEbitda: 15.4,
    roe: 32.8, roa: 15.4, roic: 24.2, grossMargin: 58.2, operatingMargin: 33.8, netMargin: 26.4,
    epsGrowthYoy: 49.1, epsGrowth5y: 22.4, revenueGrowthYoy: 14.0, revenueGrowth5y: 15.8,
    debtToEquity: 4.8, currentRatio: 2.14, quickRatio: 2.09, interestCoverage: 68.4, fcfYield: 4.8,
    rsi14: 52.8, rs52w: 74, high52w: 414.45, low52w: 291.34, priceVs52wHigh: -7.6, ma50: 372.4, ma200: 368.2,
    dividendYield: 0.42, dividendGrowth5y: 0.0, payoutRatio: 8.8,
    cEpsGrowthQtr: 49.1, aEpsGrowth3y: 24.8, nNewHigh: false, sVolumeSurge: 0.90, iInstitOwnership: 68.4,
    earningsYield: 6.8, returnOnCapital: 24.2, magicFormulaRank: 10,
    qualityScore: 88, valueScore: 80, momentumScore: 66, growthScore: 90, overallScore: 82,
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', industry: 'Semiconductors',
    price: 220.90, change: -5.28, changePct: -2.33, volume: 285000000, avgVolume: 310000000, marketCap: 5390000,
    pe: 34.8, pb: 28.4, ps: 22.4, peg: 0.4, evEbitda: 29.8,
    roe: 123.8, roa: 55.2, roic: 82.4, grossMargin: 78.4, operatingMargin: 61.8, netMargin: 55.6,
    epsGrowthYoy: 145.0, epsGrowth5y: 68.4, revenueGrowthYoy: 85.0, revenueGrowth5y: 52.4,
    debtToEquity: 38.4, currentRatio: 4.17, quickRatio: 3.89, interestCoverage: 248.8, fcfYield: 2.8,
    rsi14: 44.8, rs52w: 52, high52w: 153.13, low52w: 78.50, priceVs52wHigh: -7.0, ma50: 112.4, ma200: 118.8,
    dividendYield: 0.03, dividendGrowth5y: 8.4, payoutRatio: 1.0,
    cEpsGrowthQtr: 145.0, aEpsGrowth3y: 88.4, nNewHigh: false, sVolumeSurge: 0.92, iInstitOwnership: 65.8,
    earningsYield: 3.4, returnOnCapital: 82.4, magicFormulaRank: 22,
    qualityScore: 96, valueScore: 44, momentumScore: 48, growthScore: 99, overallScore: 82,
  },
  {
    ticker: 'META', name: 'Meta Platforms', sector: 'Communication', industry: 'Social Media',
    price: 610.26, change: -3.82, changePct: -0.62, volume: 14800000, avgVolume: 16200000, marketCap: 1556000,
    pe: 26.8, pb: 8.4, ps: 9.2, peg: 0.8, evEbitda: 19.8,
    roe: 38.4, roa: 20.8, roic: 32.4, grossMargin: 82.4, operatingMargin: 42.8, netMargin: 38.2,
    epsGrowthYoy: 52.0, epsGrowth5y: 28.4, revenueGrowthYoy: 27.1, revenueGrowth5y: 18.4,
    debtToEquity: 8.4, currentRatio: 2.68, quickRatio: 2.65, interestCoverage: 84.2, fcfYield: 3.6,
    rsi14: 58.4, rs52w: 84, high52w: 740.91, low52w: 524.67, priceVs52wHigh: -17.6, ma50: 598.4, ma200: 602.8,
    dividendYield: 0.26, dividendGrowth5y: 0.0, payoutRatio: 7.0,
    cEpsGrowthQtr: 52.0, aEpsGrowth3y: 32.4, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 74.2,
    earningsYield: 5.0, returnOnCapital: 32.4, magicFormulaRank: 7,
    qualityScore: 90, valueScore: 74, momentumScore: 72, growthScore: 92, overallScore: 84,
  },
  {
    ticker: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', industry: 'Insurance',
    price: 486.38, change: -1.84, changePct: -0.38, volume: 3600000, avgVolume: 3900000, marketCap: 1062000,
    pe: 22.8, pb: 1.7, ps: 2.2, peg: 1.9, evEbitda: 15.4,
    roe: 8.4, roa: 4.2, roic: 7.0, grossMargin: 28.4, operatingMargin: 13.2, netMargin: 10.4,
    epsGrowthYoy: 18.4, epsGrowth5y: 13.8, revenueGrowthYoy: 9.4, revenueGrowth5y: 7.2,
    debtToEquity: 28.4, currentRatio: 1.82, quickRatio: 1.74, interestCoverage: 18.4, fcfYield: 4.2,
    rsi14: 54.2, rs52w: 78, high52w: 502.00, low52w: 380.00, priceVs52wHigh: -3.1, ma50: 479.2, ma200: 462.8,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: 18.4, aEpsGrowth3y: 13.8, nNewHigh: false, sVolumeSurge: 0.92, iInstitOwnership: 58.4,
    earningsYield: 5.6, returnOnCapital: 7.0, magicFormulaRank: 90,
    qualityScore: 80, valueScore: 84, momentumScore: 68, growthScore: 60, overallScore: 73,
  },
  {
    ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Pharmaceuticals',
    price: 234.34, change: 1.08, changePct: 0.46, volume: 7200000, avgVolume: 8400000, marketCap: 564000,
    pe: 23.8, pb: 5.8, ps: 4.8, peg: 2.8, evEbitda: 14.8,
    roe: 24.4, roa: 9.8, roic: 15.4, grossMargin: 68.8, operatingMargin: 22.4, netMargin: 20.2,
    epsGrowthYoy: 6.4, epsGrowth5y: 6.8, revenueGrowthYoy: 4.4, revenueGrowth5y: 4.8,
    debtToEquity: 42.8, currentRatio: 1.38, quickRatio: 1.02, interestCoverage: 18.4, fcfYield: 4.2,
    rsi14: 56.4, rs52w: 72, high52w: 244.38, low52w: 143.13, priceVs52wHigh: -4.1, ma50: 228.4, ma200: 218.8,
    dividendYield: 2.98, dividendGrowth5y: 5.8, payoutRatio: 70.8,
    cEpsGrowthQtr: 6.4, aEpsGrowth3y: 6.8, nNewHigh: false, sVolumeSurge: 0.86, iInstitOwnership: 72.8,
    earningsYield: 5.2, returnOnCapital: 15.4, magicFormulaRank: 28,
    qualityScore: 80, valueScore: 74, momentumScore: 62, growthScore: 44, overallScore: 65,
  },
  {
    ticker: 'V', name: 'Visa Inc.', sector: 'Financials', industry: 'Payment Processing',
    price: 328.88, change: -1.84, changePct: -0.56, volume: 5800000, avgVolume: 6400000, marketCap: 672000,
    pe: 32.4, pb: 14.8, ps: 17.8, peg: 1.8, evEbitda: 25.4,
    roe: 46.8, roa: 18.4, roic: 38.4, grossMargin: 80.8, operatingMargin: 65.4, netMargin: 52.8,
    epsGrowthYoy: 12.8, epsGrowth5y: 14.8, revenueGrowthYoy: 10.2, revenueGrowth5y: 11.4,
    debtToEquity: 52.4, currentRatio: 1.42, quickRatio: 1.40, interestCoverage: 28.4, fcfYield: 2.8,
    rsi14: 57.8, rs52w: 76, high52w: 370.00, low52w: 269.64, priceVs52wHigh: -11.1, ma50: 320.4, ma200: 314.8,
    dividendYield: 0.64, dividendGrowth5y: 15.8, payoutRatio: 20.8,
    cEpsGrowthQtr: 12.8, aEpsGrowth3y: 13.8, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 91.8,
    earningsYield: 3.8, returnOnCapital: 38.4, magicFormulaRank: 20,
    qualityScore: 92, valueScore: 58, momentumScore: 66, growthScore: 74, overallScore: 76,
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Disc.', industry: 'E-Commerce',
    price: 266.32, change: -1.24, changePct: -0.46, volume: 28400000, avgVolume: 32800000, marketCap: 2820000,
    pe: 38.4, pb: 7.8, ps: 3.8, peg: 0.9, evEbitda: 22.4,
    roe: 20.4, roa: 7.8, roic: 16.8, grossMargin: 48.8, operatingMargin: 11.2, netMargin: 8.8,
    epsGrowthYoy: 94.0, epsGrowth5y: 28.4, revenueGrowthYoy: 11.0, revenueGrowth5y: 18.8,
    debtToEquity: 62.4, currentRatio: 1.12, quickRatio: 0.84, interestCoverage: 12.4, fcfYield: 2.4,
    rsi14: 56.4, rs52w: 76, high52w: 292.42, low52w: 192.63, priceVs52wHigh: -8.9, ma50: 256.8, ma200: 248.4,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: 94.0, aEpsGrowth3y: 32.4, nNewHigh: false, sVolumeSurge: 0.87, iInstitOwnership: 63.4,
    earningsYield: 2.8, returnOnCapital: 16.8, magicFormulaRank: 55,
    qualityScore: 80, valueScore: 52, momentumScore: 68, growthScore: 88, overallScore: 75,
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Disc.', industry: 'Electric Vehicles',
    price: 426.01, change: 12.48, changePct: 3.01, volume: 102400000, avgVolume: 108200000, marketCap: 1364000,
    pe: 184.8, pb: 18.4, ps: 12.4, peg: 8.4, evEbitda: 82.4,
    roe: 10.2, roa: 4.8, roic: 8.4, grossMargin: 17.8, operatingMargin: 6.2, netMargin: 5.8,
    epsGrowthYoy: -42.0, epsGrowth5y: 28.4, revenueGrowthYoy: 1.4, revenueGrowth5y: 24.8,
    debtToEquity: 18.4, currentRatio: 1.72, quickRatio: 1.42, interestCoverage: 22.4, fcfYield: 0.8,
    rsi14: 66.4, rs52w: 82, high52w: 488.54, low52w: 214.50, priceVs52wHigh: -12.8, ma50: 398.4, ma200: 358.8,
    dividendYield: 0.00, dividendGrowth5y: 0.0, payoutRatio: 0.0,
    cEpsGrowthQtr: -42.0, aEpsGrowth3y: 18.4, nNewHigh: false, sVolumeSurge: 0.95, iInstitOwnership: 45.8,
    earningsYield: 0.8, returnOnCapital: 8.4, magicFormulaRank: 92,
    qualityScore: 42, valueScore: 18, momentumScore: 72, growthScore: 38, overallScore: 38,
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', industry: 'Banking',
    price: 306.38, change: -1.44, changePct: -0.47, volume: 8400000, avgVolume: 9200000, marketCap: 874000,
    pe: 14.2, pb: 2.2, ps: 4.2, peg: 1.6, evEbitda: 10.4,
    roe: 16.8, roa: 1.4, roic: 13.2, grossMargin: 58.4, operatingMargin: 36.8, netMargin: 30.2,
    epsGrowthYoy: 14.8, epsGrowth5y: 12.4, revenueGrowthYoy: 10.8, revenueGrowth5y: 9.4,
    debtToEquity: 142.4, currentRatio: 1.18, quickRatio: 1.14, interestCoverage: 4.8, fcfYield: 7.2,
    rsi14: 54.2, rs52w: 74, high52w: 320.48, low52w: 207.65, priceVs52wHigh: -4.4, ma50: 298.4, ma200: 284.8,
    dividendYield: 1.50, dividendGrowth5y: 8.4, payoutRatio: 21.4,
    cEpsGrowthQtr: 14.8, aEpsGrowth3y: 14.8, nNewHigh: false, sVolumeSurge: 0.91, iInstitOwnership: 74.8,
    earningsYield: 8.8, returnOnCapital: 13.2, magicFormulaRank: 12,
    qualityScore: 82, valueScore: 86, momentumScore: 68, growthScore: 68, overallScore: 78,
  },
  {
    ticker: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer Staples', industry: 'Beverages',
    price: 81.48, change: 0.38, changePct: 0.47, volume: 11200000, avgVolume: 12800000, marketCap: 350000,
    pe: 31.4, pb: 11.4, ps: 7.2, peg: 4.8, evEbitda: 22.4,
    roe: 38.2, roa: 8.2, roic: 12.4, grossMargin: 60.2, operatingMargin: 22.8, netMargin: 22.4,
    epsGrowthYoy: 7.2, epsGrowth5y: 5.8, revenueGrowthYoy: 2.8, revenueGrowth5y: 5.8,
    debtToEquity: 184.8, currentRatio: 1.12, quickRatio: 0.98, interestCoverage: 12.4, fcfYield: 3.2,
    rsi14: 58.4, rs52w: 68, high52w: 84.81, low52w: 58.97, priceVs52wHigh: -3.9, ma50: 79.2, ma200: 73.8,
    dividendYield: 2.94, dividendGrowth5y: 4.8, payoutRatio: 92.4,
    cEpsGrowthQtr: 7.2, aEpsGrowth3y: 5.8, nNewHigh: false, sVolumeSurge: 0.88, iInstitOwnership: 68.4,
    earningsYield: 4.0, returnOnCapital: 12.4, magicFormulaRank: 44,
    qualityScore: 80, valueScore: 60, momentumScore: 60, growthScore: 36, overallScore: 59,
  },
  {
    ticker: 'COST', name: 'Costco Wholesale', sector: 'Consumer Staples', industry: 'Retail',
    price: 1028.24, change: -7.84, changePct: -0.76, volume: 2200000, avgVolume: 2600000, marketCap: 457000,
    pe: 58.4, pb: 16.8, ps: 1.4, peg: 3.2, evEbitda: 38.4,
    roe: 29.4, roa: 8.8, roic: 22.4, grossMargin: 12.8, operatingMargin: 4.2, netMargin: 2.8,
    epsGrowthYoy: 16.4, epsGrowth5y: 14.8, revenueGrowthYoy: 8.4, revenueGrowth5y: 10.8,
    debtToEquity: 42.4, currentRatio: 0.96, quickRatio: 0.48, interestCoverage: 28.4, fcfYield: 1.6,
    rsi14: 58.4, rs52w: 80, high52w: 1078.23, low52w: 748.87, priceVs52wHigh: -4.6, ma50: 1012.4, ma200: 965.8,
    dividendYield: 0.41, dividendGrowth5y: 12.8, payoutRatio: 24.2,
    cEpsGrowthQtr: 16.4, aEpsGrowth3y: 15.8, nNewHigh: false, sVolumeSurge: 0.85, iInstitOwnership: 72.8,
    earningsYield: 2.2, returnOnCapital: 22.4, magicFormulaRank: 64,
    qualityScore: 88, valueScore: 40, momentumScore: 74, growthScore: 72, overallScore: 70,
  },
  {
    ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Health Insurance',
    price: 388.47, change: 4.28, changePct: 1.11, volume: 6800000, avgVolume: 5400000, marketCap: 356000,
    pe: 14.8, pb: 3.8, ps: 0.72, peg: 1.0, evEbitda: 9.8,
    roe: 26.4, roa: 7.2, roic: 16.8, grossMargin: 22.8, operatingMargin: 7.2, netMargin: 4.8,
    epsGrowthYoy: -38.0, epsGrowth5y: 14.8, revenueGrowthYoy: 9.8, revenueGrowth5y: 12.4,
    debtToEquity: 82.4, currentRatio: 0.72, quickRatio: 0.68, interestCoverage: 8.4, fcfYield: 6.8,
    rsi14: 44.8, rs52w: 28, high52w: 631.17, low52w: 280.00, priceVs52wHigh: -38.4, ma50: 348.4, ma200: 442.8,
    dividendYield: 2.24, dividendGrowth5y: 14.8, payoutRatio: 33.2,
    cEpsGrowthQtr: -38.0, aEpsGrowth3y: 14.8, nNewHigh: false, sVolumeSurge: 1.26, iInstitOwnership: 88.4,
    earningsYield: 8.4, returnOnCapital: 16.8, magicFormulaRank: 18,
    qualityScore: 72, valueScore: 88, momentumScore: 24, growthScore: 52, overallScore: 60,
  },
  {
    ticker: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', industry: 'Biopharmaceuticals',
    price: 215.70, change: 1.24, changePct: 0.58, volume: 5800000, avgVolume: 6200000, marketCap: 380000,
    pe: 68.4, pb: 38.4, ps: 7.2, peg: 2.8, evEbitda: 24.8,
    roe: 52.4, roa: 8.8, roic: 14.8, grossMargin: 70.4, operatingMargin: 26.4, netMargin: 16.4,
    epsGrowthYoy: 6.8, epsGrowth5y: 9.8, revenueGrowthYoy: 5.8, revenueGrowth5y: 10.2,
    debtToEquity: 484.8, currentRatio: 0.74, quickRatio: 0.68, interestCoverage: 6.4, fcfYield: 3.8,
    rsi14: 58.4, rs52w: 74, high52w: 227.52, low52w: 155.77, priceVs52wHigh: -5.2, ma50: 210.4, ma200: 198.8,
    dividendYield: 3.24, dividendGrowth5y: 8.8, payoutRatio: 224.8,
    cEpsGrowthQtr: 6.8, aEpsGrowth3y: 8.4, nNewHigh: false, sVolumeSurge: 0.94, iInstitOwnership: 68.4,
    earningsYield: 4.2, returnOnCapital: 14.8, magicFormulaRank: 34,
    qualityScore: 72, valueScore: 66, momentumScore: 66, growthScore: 48, overallScore: 63,
  },
];

// ─── Chart Data Generators ────────────────────────────────────────────────────
export function generatePriceHistory(
  basePrice: number,
  days: number = 365,
  volatility: number = 0.015
): { date: string; price: number; volume: number }[] {
  const data = [];
  let price = basePrice * 0.75;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * volatility;
    price = price * (1 + change);
    data.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.round((Math.random() * 0.8 + 0.6) * 50000000),
    });
  }
  // Ensure last price matches
  if (data.length > 0) {
    data[data.length - 1].price = basePrice;
  }
  return data;
}

export function generateIndexHistory(
  baseValue: number,
  days: number = 365
): { date: string; value: number }[] {
  const data = [];
  let value = baseValue * 0.78;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.47) * 0.008;
    value = value * (1 + change);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }
  if (data.length > 0) {
    data[data.length - 1].value = baseValue;
  }
  return data;
}

// ─── Legendary Investor Portfolios ───────────────────────────────────────────
export const legendaryPortfolios: LegendaryPortfolio[] = [
  {
    investor: 'Warren Buffett',
    title: 'Berkshire Hathaway (13F)',
    style: '가치투자 — 내재가치 이하 우량 기업 장기보유',
    holdings: [
      { ticker: 'AAPL', name: 'Apple', weight: 40.8, action: 'Hold' },
      { ticker: 'BAC', name: 'Bank of America', weight: 11.2, action: 'Hold' },
      { ticker: 'AXP', name: 'American Express', weight: 9.4, action: 'Hold' },
      { ticker: 'KO', name: 'Coca-Cola', weight: 8.2, action: 'Hold' },
      { ticker: 'CVX', name: 'Chevron', weight: 6.8, action: 'Hold' },
    ],
  },
  {
    investor: 'Michael Burry',
    title: 'Scion Asset Mgmt (13F)',
    style: '역발상 가치투자 — 극도로 저평가된 자산',
    holdings: [
      { ticker: 'BABA', name: 'Alibaba', weight: 21.4, action: 'Buy' },
      { ticker: 'JD', name: 'JD.com', weight: 18.2, action: 'Buy' },
      { ticker: 'GOOG', name: 'Alphabet', weight: 14.8, action: 'Hold' },
      { ticker: 'META', name: 'Meta', weight: 12.4, action: 'Buy' },
      { ticker: 'AMZN', name: 'Amazon', weight: 10.2, action: 'Hold' },
    ],
  },
  {
    investor: 'Cathie Wood',
    title: 'ARK Invest (ETF Holdings)',
    style: '혁신 성장주 — 파괴적 기술 장기 테마',
    holdings: [
      { ticker: 'TSLA', name: 'Tesla', weight: 10.4, action: 'Buy' },
      { ticker: 'COIN', name: 'Coinbase', weight: 8.8, action: 'Buy' },
      { ticker: 'ROKU', name: 'Roku', weight: 7.2, action: 'Buy' },
      { ticker: 'SHOP', name: 'Shopify', weight: 6.4, action: 'Buy' },
      { ticker: 'CRSP', name: 'CRISPR Tx', weight: 5.8, action: 'Hold' },
    ],
  },
];

// ─── Default Portfolio ─────────────────────────────── 2026-05-22 실제가 반영 ─
export const defaultPortfolio: PortfolioPosition[] = [
  { id: '1', ticker: 'MSFT', name: 'Microsoft', shares: 10, avgCost: 380.00, currentPrice: 418.57, sector: 'Technology', purchaseDate: '2024-01-15' },
  { id: '2', ticker: 'GOOGL', name: 'Alphabet', shares: 15, avgCost: 150.00, currentPrice: 382.97, sector: 'Communication', purchaseDate: '2024-02-01' },
  { id: '3', ticker: 'V', name: 'Visa', shares: 20, avgCost: 255.00, currentPrice: 328.88, sector: 'Financials', purchaseDate: '2024-03-10' },
  { id: '4', ticker: 'JPM', name: 'JPMorgan', shares: 25, avgCost: 175.00, currentPrice: 306.38, sector: 'Financials', purchaseDate: '2024-01-20' },
  { id: '5', ticker: 'ABBV', name: 'AbbVie', shares: 30, avgCost: 155.00, currentPrice: 215.70, sector: 'Healthcare', purchaseDate: '2024-04-05' },
];
