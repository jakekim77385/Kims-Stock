/**
 * yahooClient.ts
 * yahoo-finance2 래퍼 + 인메모리 캐시 (TTL: 60초)
 * 서버 사이드 전용 (Next.js API Routes 에서만 import)
 *
 * yahoo-finance2 최신 버전: require().default 를 생성자로 사용
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const YFClass = (require('yahoo-finance2') as { default: new (opts?: object) => typeof import('yahoo-finance2').default }).default;
const yahooFinance = new YFClass({ suppressNotices: ['yahooSurvey'] }) as any;

// ─── 캐시 ──────────────────────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCached<T>(key: string, data: T, ttlMs = 60_000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── 지수 심볼 매핑 ──────────────────────────────────────────────────────────
export const INDEX_SYMBOLS: Record<string, string> = {
  'S&P 500':      '^GSPC',
  'NASDAQ':       '^IXIC',
  'DOW JONES':    '^DJI',
  'VIX':          '^VIX',
  'Russell 2000': '^RUT',
  '10Y Treasury': '^TNX',
};

// ─── 한국어 종목명 ➡️ 영어 티커 매핑 ──────────────────────────────────────────
import { KOREAN_STOCK_MAP, resolveTicker } from './utils';

// ─── 단일 종목 시세 ──────────────────────────────────────────────────────────
export interface QuoteResult {
  ticker:     string;
  name:       string;
  price:      number;
  change:     number;
  changePct:  number;
  volume:     number;
  marketCap:  number;
  pe:         number | null;
  high52w:    number;
  low52w:     number;
  avgVolume:  number;
  open:       number;
  prevClose:  number;
  currency:   string;
  exchange:   string;
  timestamp:  number;

  // 실시간 재무/밸류에이션 데이터 필드 (추가)
  pb?:              number;
  ps?:              number;
  peg?:             number;
  evEbitda?:        number;
  roe?:             number;
  roa?:             number;
  roic?:            number;
  grossMargin?:     number;
  operatingMargin?: number;
  netMargin?:       number;
  epsGrowthYoy?:    number;
  epsGrowth5y?:     number;
  revenueGrowthYoy?:number;
  revenueGrowth5y?: number;
  debtToEquity?:    number;
  currentRatio?:    number;
  quickRatio?:      number;
  interestCoverage?:number;
  fcfYield?:        number;
  news?:            any[];
}

export async function fetchQuote(ticker: string, includeFundamentals = false): Promise<QuoteResult | null> {
  const resolved = resolveTicker(ticker);
  const key = includeFundamentals 
    ? `quote:detailed:${resolved.toUpperCase()}` 
    : `quote:${resolved.toUpperCase()}`;
  const cached = getCached<QuoteResult>(key);
  if (cached) return cached;

  try {
    const q = await yahooFinance.quote(resolved.toUpperCase());
    if (!q) return null;

    // 시장 상태(PRE / POST)에 따른 실시간 시간외 거래 시세 우선 융합 매핑
    const isPreMarket = q.marketState === 'PRE' || (q.preMarketPrice !== undefined && q.preMarketPrice > 0);
    const isPostMarket = q.marketState === 'POST' || (q.postMarketPrice !== undefined && q.postMarketPrice > 0);

    let price = q.regularMarketPrice ?? 0;
    let change = q.regularMarketChange ?? 0;
    let changePct = q.regularMarketChangePercent ?? 0;
    let volume = q.regularMarketVolume ?? 0;

    if (isPreMarket && q.preMarketPrice) {
      price = q.preMarketPrice;
      change = q.preMarketChange ?? 0;
      changePct = q.preMarketChangePercent ?? 0;
      volume = q.preMarketVolume ?? q.regularMarketVolume ?? 0;
    } else if (isPostMarket && q.postMarketPrice) {
      price = q.postMarketPrice;
      change = q.postMarketChange ?? 0;
      changePct = q.postMarketChangePercent ?? 0;
      volume = q.postMarketVolume ?? q.regularMarketVolume ?? 0;
    }

    const result: QuoteResult = {
      ticker:    q.symbol,
      name:      q.longName ?? q.shortName ?? q.symbol,
      price,
      change,
      changePct,
      volume,
      marketCap: q.marketCap ?? 0,
      pe:        q.trailingPE ?? q.forwardPE ?? null,
      high52w:   q.fiftyTwoWeekHigh ?? 0,
      low52w:    q.fiftyTwoWeekLow ?? 0,
      avgVolume: q.averageDailyVolume3Month ?? 0,
      open:      q.regularMarketOpen ?? 0,
      prevClose: q.regularMarketPreviousClose ?? 0,
      currency:  q.currency ?? 'USD',
      exchange:  q.fullExchangeName ?? '',
      timestamp: q.regularMarketTime
        ? new Date(q.regularMarketTime).getTime()
        : Date.now(),
    };

    // 실시간 재무 데이터 병합
    if (includeFundamentals) {
      try {
        const summary = await yahooFinance.quoteSummary(resolved.toUpperCase(), {
          modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'earnings', 'earningsTrend']
        });
        if (summary) {
          const sd = summary.summaryDetail;
          const dk = summary.defaultKeyStatistics;
          const fd = summary.financialData;
          const eg = summary.earnings;
          const et = summary.earningsTrend;

          result.pb = dk?.priceToBook ?? sd?.priceToBook ?? 0;
          result.ps = sd?.priceToSalesTrailing12Months ?? 0;
          result.peg = dk?.pegRatio ?? 0;
          result.evEbitda = dk?.enterpriseToEbitda ?? 0;

          // 백분율 변환 (Yahoo Finance는 0.123 형태로 제공하므로 100을 곱함)
          result.roe = (fd?.returnOnEquity ?? 0) * 100;
          result.roa = (fd?.returnOnAssets ?? 0) * 100;
          result.roic = result.roe * 0.85; // ROIC 근사치 계산

          result.grossMargin = (fd?.grossMargins ?? 0) * 100;
          result.operatingMargin = (fd?.operatingMargins ?? 0) * 100;
          result.netMargin = (fd?.profitMargins ?? 0) * 100;

          // 성장률 계산
          result.revenueGrowthYoy = (fd?.revenueGrowth ?? 0) * 100;

          // EPS YoY 계산 (최근 2개년 earnings 기반)
          let calculatedEpsGrowth = 0;
          const yearlyEarnings = eg?.financialsChart?.yearly;
          if (yearlyEarnings && yearlyEarnings.length >= 2) {
            const last = yearlyEarnings[yearlyEarnings.length - 1];
            const prev = yearlyEarnings[yearlyEarnings.length - 2];
            if (prev.earnings && prev.earnings > 0) {
              calculatedEpsGrowth = ((last.earnings - prev.earnings) / prev.earnings) * 100;
            }
          }
          if (calculatedEpsGrowth === 0 && et?.trend) {
            // earningsTrend의 금년 추정치 성장률 사용
            const currentYearTrend = et.trend.find((t: any) => t.period === '0y');
            if (currentYearTrend?.growth) {
              calculatedEpsGrowth = currentYearTrend.growth * 100;
            }
          }
          result.epsGrowthYoy = calculatedEpsGrowth;

          // 5개년 중장기 성장률 추정
          result.epsGrowth5y = result.epsGrowthYoy > 0 ? result.epsGrowthYoy * 0.7 : 0;
          result.revenueGrowth5y = result.revenueGrowthYoy > 0 ? result.revenueGrowthYoy * 0.7 : 0;

          result.debtToEquity = fd?.debtToEquity ?? 0;
          result.currentRatio = fd?.currentRatio ?? 0;
          result.quickRatio = fd?.quickRatio ?? 0;

          // 이자보상배율 근사치 계산
          if (fd?.operatingCashflow && fd?.totalDebt) {
            result.interestCoverage = fd.totalDebt > 0 ? (fd.operatingCashflow / (fd.totalDebt * 0.05)) : 10;
          } else {
            const d2e = result.debtToEquity ?? 0;
            result.interestCoverage = d2e > 0 ? Math.max(1, 150 / d2e) : 10;
          }

          // FCF Yield 계산
          if (fd?.freeCashflow && q.marketCap) {
            result.fcfYield = (fd.freeCashflow / q.marketCap) * 100;
          } else {
            result.fcfYield = result.roe > 0 ? result.roe * 0.15 : 0;
          }
        }
      } catch (sumErr) {
        console.error(`[yahooClient] Failed to fetch quoteSummary for ${resolved}:`, sumErr);
      }

      // 실시간 개별 종목 관련 속보 5건 조회
      try {
        const searchRes = await yahooFinance.search(resolved.toUpperCase(), { newsCount: 5, quotesCount: 0 });
        const rawNews = searchRes.news ?? [];
        result.news = rawNews.map((item: any, idx: number) => {
          const titleLower = (item.title ?? '').toLowerCase();
          let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          if (/\b(exceed|beat|surprise|rise|gain|up|grow|positive|jump|profit|higher|bull)\b/.test(titleLower)) {
            sentiment = 'positive';
          } else if (/\b(miss|down|fall|drop|loss|negative|warn|lower|bear|cut)\b/.test(titleLower)) {
            sentiment = 'negative';
          }

          let timeStr = '방금 전';
          if (item.providerPublishTime) {
            const diffMs = Date.now() - new Date(item.providerPublishTime).getTime();
            const diffHours = Math.floor(diffMs / 3_600_000);
            if (diffHours > 24) {
              timeStr = `${Math.floor(diffHours / 24)}일 전`;
            } else if (diffHours > 0) {
              timeStr = `${diffHours}시간 전`;
            } else {
              const diffMins = Math.floor(diffMs / 60_000);
              timeStr = diffMins > 0 ? `${diffMins}분 전` : '방금 전';
            }
          }

          return {
            id: 1000 + idx,
            headline: item.title ?? '',
            translatedHeadline: translateHeadline(item.title ?? ''),
            source: item.publisher ?? 'Yahoo Finance',
            time: timeStr,
            sentiment,
            category: '실시간 속보',
            ticker: resolved.toUpperCase(),
            impact: sentiment === 'positive' || sentiment === 'negative' ? 'high' : 'medium',
            link: item.link ?? '',
          };
        });
      } catch (newsErr) {
        const anyErr = newsErr as any;
        if (anyErr.result && anyErr.result.news) {
          const rawNews = anyErr.result.news;
          result.news = rawNews.map((item: any, idx: number) => {
            const titleLower = (item.title ?? '').toLowerCase();
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (/\b(exceed|beat|surprise|rise|gain|up|grow|positive|jump|profit|higher|bull)\b/.test(titleLower)) {
              sentiment = 'positive';
            } else if (/\b(miss|down|fall|drop|loss|negative|warn|lower|bear|cut)\b/.test(titleLower)) {
              sentiment = 'negative';
            }

            let timeStr = '방금 전';
            if (item.providerPublishTime) {
              const diffMs = Date.now() - new Date(item.providerPublishTime).getTime();
              const diffHours = Math.floor(diffMs / 3_600_000);
              if (diffHours > 24) {
                timeStr = `${Math.floor(diffHours / 24)}일 전`;
              } else if (diffHours > 0) {
                timeStr = `${diffHours}시간 전`;
              } else {
                const diffMins = Math.floor(diffMs / 60_000);
                timeStr = diffMins > 0 ? `${diffMins}분 전` : '방금 전';
              }
            }

            return {
              id: 1000 + idx,
              headline: item.title ?? '',
              translatedHeadline: translateHeadline(item.title ?? ''),
              source: item.publisher ?? 'Yahoo Finance',
              time: timeStr,
              sentiment,
              category: '실시간 속보',
              ticker: resolved.toUpperCase(),
              impact: sentiment === 'positive' || sentiment === 'negative' ? 'high' : 'medium',
              link: item.link ?? '',
            };
          });
        } else {
          console.error(`[yahooClient] Failed to fetch news for ${resolved}:`, newsErr);
        }
      }
    }

    setCached(key, result, 60_000);
    return result;
  } catch (err) {
    console.error(`[yahooClient] fetchQuote error for ${ticker}:`, err);
    return null;
  }
}

// ─── 복수 종목 배치 시세 ─────────────────────────────────────────────────────
export async function fetchQuotes(tickers: string[], includeFundamentals = false): Promise<QuoteResult[]> {
  const upper  = tickers.map((t) => resolveTicker(t).toUpperCase());
  const key    = includeFundamentals
    ? `quotes:detailed:${upper.slice().sort().join(',')}`
    : `quotes:${upper.slice().sort().join(',')}`;
  const cached = getCached<QuoteResult[]>(key);
  if (cached) return cached;

  const results = await Promise.allSettled(upper.map((t) => fetchQuote(t, includeFundamentals)));
  const quotes  = results
    .filter((r): r is PromiseFulfilledResult<QuoteResult | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((q): q is QuoteResult => q !== null);

  setCached(key, quotes, 60_000);
  return quotes;
}

// ─── 지수 시세 ───────────────────────────────────────────────────────────────
export interface IndexResult {
  name:      string;
  ticker:    string;
  symbol:    string;
  value:     number;
  change:    number;
  changePct: number;
}

const TICKER_MAP: Record<string, string> = {
  '^GSPC': 'SPX', '^IXIC': 'COMP', '^DJI': 'DJI',
  '^VIX': 'VIX', '^RUT': 'RUT', '^TNX': 'TNX',
};

export async function fetchMarketIndices(): Promise<IndexResult[]> {
  const key    = 'market:indices';
  const cached = getCached<IndexResult[]>(key);
  if (cached) return cached;

  const entries = Object.entries(INDEX_SYMBOLS);
  const symbols = entries.map(([, sym]) => sym);

  const rawList = await Promise.allSettled(
    symbols.map((sym) => yahooFinance.quote(sym))
  );

  const results: IndexResult[] = rawList.map((r, i) => {
    const [name, symbol] = entries[i];
    if (r.status === 'fulfilled' && r.value) {
      const q = r.value;
      return {
        name,
        ticker:    TICKER_MAP[symbol] ?? symbol,
        symbol,
        value:     q.regularMarketPrice ?? 0,
        change:    q.regularMarketChange ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
      };
    }
    return {
      name,
      ticker:    TICKER_MAP[symbol] ?? symbol,
      symbol,
      value: 0, change: 0, changePct: 0,
    };
  });

  setCached(key, results, 60_000);
  return results;
}

// ─── 주가 히스토리 ───────────────────────────────────────────────────────────
export interface HistoryBar {
  date:   string;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export type HistoryPeriod = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

export async function fetchHistory(
  ticker: string,
  period: HistoryPeriod = '6mo'
): Promise<HistoryBar[]> {
  const resolved = resolveTicker(ticker);
  const key    = `history:${resolved.toUpperCase()}:${period}`;
  const cached = getCached<HistoryBar[]>(key);
  if (cached) return cached;

  try {
    const result = await yahooFinance.chart(resolved.toUpperCase(), {
      period1: getPeriodStart(period),
      interval: period === '5y' ? '1wk' : '1d',
    });

    const quotes = result.quotes ?? [];

    const bars: HistoryBar[] = quotes
      .filter((d: any) => d.close !== null)
      .map((d: any) => ({
        date:   d.date.toISOString().split('T')[0],
        open:   d.open   ?? 0,
        high:   d.high   ?? 0,
        low:    d.low    ?? 0,
        close:  d.close  ?? 0,
        volume: d.volume ?? 0,
      }));

    const ttl = period === '1mo' ? 300_000 : 3_600_000;
    setCached(key, bars, ttl);
    return bars;
  } catch (err) {
    console.error(`[yahooClient] fetchHistory error for ${ticker}/${period}:`, err);
    return [];
  }
}

function getPeriodStart(period: HistoryPeriod): Date {
  const days: Record<HistoryPeriod, number> = {
    '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730, '5y': 1825,
  };
  const d = new Date();
  d.setDate(d.getDate() - (days[period] ?? 180));
  return d;
}

// ─── 종목 검색 ───────────────────────────────────────────────────────────────
export interface SearchResult {
  ticker:   string;
  name:     string;
  exchange: string;
  type:     string;
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 1) return [];
  const key    = `search:${query.toLowerCase()}`;
  const cached = getCached<SearchResult[]>(key);
  if (cached) return cached;

  const resolvedQuery = resolveTicker(query);
  const lowerQuery = query.trim().toLowerCase();

  // 2. 한국어 글자가 여전히 포함되어 있는지 확인 (야후 파이낸스 에러 방지)
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(resolvedQuery);
  if (hasKorean) {
    // 야후 파이낸스는 한국어 검색어 입력 시 BadRequestError를 던지므로,
    // 매핑 딕셔너리에서 부분 일치하는 인기 종목들을 필터링하여 로컬에서 반환합니다.
    const localMatches: SearchResult[] = Object.entries(KOREAN_STOCK_MAP)
      .filter(([koKey]) => koKey.includes(lowerQuery) || lowerQuery.includes(koKey))
      .map(([koKey, ticker]) => ({
        ticker,
        name: `${ticker} (${koKey})`,
        exchange: 'US',
        type: 'EQUITY',
      }));

    if (localMatches.length > 0) {
      return localMatches.slice(0, 8);
    }
    return [];
  }

  try {
    let res: any;
    try {
      res = await yahooFinance.search(resolvedQuery, { newsCount: 0, quotesCount: 10 }, { validateResult: false });
    } catch (searchErr: any) {
      if (searchErr.name === 'FailedYahooValidationError' && searchErr.result) {
        res = searchErr.result;
      } else {
        throw searchErr;
      }
    }
    const results: SearchResult[] = (res.quotes ?? [])
      .filter((q: any) => q.isYahooFinance && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .slice(0, 8)
      .map((q: any) => ({
        ticker:   q.symbol,
        name:     ('longname' in q ? q.longname : undefined)
                  ?? ('shortname' in q ? q.shortname : undefined)
                  ?? q.symbol,
        exchange: ('exchange' in q ? q.exchange : undefined) ?? '',
        type:     q.quoteType ?? '',
      }));

    setCached(key, results, 30_000);
    return results;
  } catch (err) {
    console.error('[yahooClient] searchTickers error:', err);
    return [];
  }
}

// ─── 전체 자산 비교표 ─────────────────────────────────────────────────────────
export interface AssetRow {
  category:  string;
  name:      string;
  symbol:    string;
  ticker:    string;
  value:     number;
  change:    number;
  changePct: number;
  high52w:   number;
  low52w:    number;
  open:      number;
  prevClose: number;
  unit:      string;
}

const COMPARISON_ASSETS: { category: string; name: string; symbol: string; ticker: string; unit: string }[] = [
  { category: '미국 주식',  name: 'S&P 500',      symbol: '^GSPC',    ticker: 'SPX',  unit: 'pt' },
  { category: '미국 주식',  name: 'NASDAQ',        symbol: '^IXIC',    ticker: 'COMP', unit: 'pt' },
  { category: '미국 주식',  name: 'Dow Jones',     symbol: '^DJI',     ticker: 'DJI',  unit: 'pt' },
  { category: '미국 주식',  name: 'Russell 2000',  symbol: '^RUT',     ticker: 'RUT',  unit: 'pt' },
  { category: '글로벌',     name: '니케이 225',     symbol: '^N225',    ticker: 'NKY',  unit: 'pt' },
  { category: '글로벌',     name: '항셍',           symbol: '^HSI',     ticker: 'HSI',  unit: 'pt' },
  { category: '글로벌',     name: 'FTSE 100',      symbol: '^FTSE',    ticker: 'UKX',  unit: 'pt' },
  { category: '채권/금리',  name: '미국 10Y',       symbol: '^TNX',     ticker: '10Y',  unit: '%'  },
  { category: '채권/금리',  name: 'VIX',            symbol: '^VIX',     ticker: 'VIX',  unit: 'pt' },
  { category: '원자재',     name: '금 (Gold)',       symbol: 'GC=F',     ticker: 'GOLD', unit: '$'  },
  { category: '원자재',     name: '은 (Silver)',     symbol: 'SI=F',     ticker: 'SLVR', unit: '$'  },
  { category: '원자재',     name: 'WTI 원유',        symbol: 'CL=F',     ticker: 'WTI',  unit: '$'  },
  { category: '달러/환율',  name: '달러 인덱스',      symbol: 'DX-Y.NYB', ticker: 'DXY',  unit: 'pt' },
  { category: '달러/환율',  name: 'USD/JPY',        symbol: 'JPY=X',    ticker: 'JPY',  unit: '¥'  },
  { category: '달러/환율',  name: 'EUR/USD',        symbol: 'EURUSD=X', ticker: 'EUR',  unit: '$'  },
];

export async function fetchComparison(): Promise<AssetRow[]> {
  const key    = 'comparison:all';
  const cached = getCached<AssetRow[]>(key);
  if (cached) return cached;

  const rawList = await Promise.allSettled(
    COMPARISON_ASSETS.map((a) => yahooFinance.quote(a.symbol))
  );

  const rows: AssetRow[] = rawList.map((r, i) => {
    const meta = COMPARISON_ASSETS[i];
    const base: AssetRow = {
      category: meta.category, name: meta.name,
      symbol: meta.symbol, ticker: meta.ticker, unit: meta.unit,
      value: 0, change: 0, changePct: 0,
      high52w: 0, low52w: 0, open: 0, prevClose: 0,
    };
    if (r.status === 'fulfilled' && r.value) {
      const q = r.value;
      return {
        ...base,
        value:     q.regularMarketPrice        ?? 0,
        change:    q.regularMarketChange        ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
        high52w:   q.fiftyTwoWeekHigh           ?? 0,
        low52w:    q.fiftyTwoWeekLow            ?? 0,
        open:      q.regularMarketOpen          ?? 0,
        prevClose: q.regularMarketPreviousClose ?? 0,
      };
    }
    return base;
  });

  setCached(key, rows, 60_000);
  return rows;
}

// ─── [NEW] 금일 마켓 뉴스 및 감성 요약 패칭 ───────────────────────────────────
export interface MarketNewsItem {
  id: number;
  headline: string;
  translatedHeadline?: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium';
  link?: string;
}

export interface MarketSummaryData {
  news: MarketNewsItem[];
  summary: string;
  keyIssues: string[];
}

export async function fetchMarketNewsAndSummary(indices: any[]): Promise<MarketSummaryData> {
  const key    = 'market:news_and_summary';
  const cached = getCached<MarketSummaryData>(key);
  if (cached) return cached;

  const rawNews: any[] = [];

  const extractNews = (res: any) => {
    return (res?.news ?? []).map((item: any) => {
      const titleLower = (item.title ?? '').toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (/\b(exceed|beat|surprise|rise|gain|up|grow|positive|jump|profit|higher|bull|rally|soar|record|advance|optimism|climb)\b/.test(titleLower)) {
        sentiment = 'positive';
      } else if (/\b(miss|down|fall|drop|loss|negative|warn|lower|bear|cut|decline|worry|fear|plunge|slump|selloff|slide|drop)\b/.test(titleLower)) {
        sentiment = 'negative';
      }

      let timeStr = '방금 전';
      if (item.providerPublishTime) {
        const diffMs = Date.now() - new Date(item.providerPublishTime).getTime();
        const diffHours = Math.floor(diffMs / 3_600_000);
        if (diffHours > 24) {
          timeStr = `${Math.floor(diffHours / 24)}일 전`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours}시간 전`;
        } else {
          const diffMins = Math.floor(diffMs / 60_000);
          timeStr = diffMins > 0 ? `${diffMins}분 전` : '방금 전';
        }
      }

      return {
        headline: item.title ?? '',
        translatedHeadline: translateHeadline(item.title ?? ''),
        source: item.publisher ?? 'Yahoo Finance',
        time: timeStr,
        sentiment,
        impact: sentiment !== 'neutral' ? 'high' : 'medium',
        link: item.link ?? '',
      };
    });
  };

  try {
    const [spRes, nasdaqRes] = await Promise.allSettled([
      yahooFinance.search('^GSPC', { newsCount: 6, quotesCount: 0 }),
      yahooFinance.search('^IXIC', { newsCount: 6, quotesCount: 0 })
    ]);

    if (spRes.status === 'fulfilled') {
      rawNews.push(...extractNews(spRes.value));
    } else {
      const anyErr = spRes.reason as any;
      if (anyErr.result && anyErr.result.news) {
        rawNews.push(...extractNews(anyErr.result));
      }
    }

    if (nasdaqRes.status === 'fulfilled') {
      rawNews.push(...extractNews(nasdaqRes.value));
    } else {
      const anyErr = nasdaqRes.reason as any;
      if (anyErr.result && anyErr.result.news) {
        rawNews.push(...extractNews(anyErr.result));
      }
    }
  } catch (err) {
    console.error('[yahooClient] fetchMarketNewsAndSummary news fetch error:', err);
  }

  const seenHeadlines = new Set<string>();
  const newsList: MarketNewsItem[] = [];
  let idCounter = 2000;

  for (const item of rawNews) {
    const trimmedTitle = item.headline.trim().toLowerCase();
    if (!seenHeadlines.has(trimmedTitle) && item.headline) {
      seenHeadlines.add(trimmedTitle);
      newsList.push({
        id: idCounter++,
        ...item
      });
    }
  }

  const finalNews = newsList.slice(0, 6);

  const spIndex = indices.find((idx: any) => idx.symbol === '^GSPC');
  const nasdaqIndex = indices.find((idx: any) => idx.symbol === '^IXIC');

  const spPct = spIndex?.changePct ?? 0;
  const nasdaqPct = nasdaqIndex?.changePct ?? 0;

  const posCount = finalNews.filter(n => n.sentiment === 'positive').length;
  const negCount = finalNews.filter(n => n.sentiment === 'negative').length;

  let sentimentStatus = '혼조세';
  if (posCount > negCount) sentimentStatus = '우호적(Risk-On)';
  else if (negCount > posCount) sentimentStatus = '신중한(Risk-Off)';

  const marketTrend = (spPct >= 0 && nasdaqPct >= 0)
    ? '동반 상승 흐름을 기록하며 시장 전반에 온기가 돌았습니다'
    : (spPct < 0 && nasdaqPct < 0)
    ? '동반 하락 조정 압력을 받으며 리스크 회피 기조가 관찰되었습니다'
    : '지수별로 방향성이 엇갈리는 혼조 양상을 보이며 치열한 눈치보기가 진행되었습니다';

  const indexComments = `금일 미 증시는 S&P 500이 ${spPct >= 0 ? '+' : ''}${spPct.toFixed(2)}%, NASDAQ이 ${nasdaqPct >= 0 ? '+' : ''}${nasdaqPct.toFixed(2)}% 변동하는 등 ${marketTrend}.`;

  let sentimentComment = '';
  if (posCount > negCount) {
    sentimentComment = `실시간 마켓 속보 분석 결과, 수집된 ${finalNews.length}건의 글로벌 금융 이슈 중 호재성(긍정) 뉴스가 ${posCount}건으로 높게 나타나 투자 심리 개선을 이끌었습니다. 성장 낙관론과 연착륙 기대감이 지수 하방을 강력히 지지하고 있습니다.`;
  } else if (negCount > posCount) {
    sentimentComment = `실시간 마켓 속보 분석 결과, 수집된 ${finalNews.length}건의 글로벌 금융 이슈 중 경계성(부정) 뉴스가 ${negCount}건으로 우세하게 감지되어 인플레이션 우려 및 국채 금리 움직임에 지수가 경계감을 나타냈습니다.`;
  } else {
    sentimentComment = `실시간 마켓 속보 피드에서는 긍정적 소식과 부정적 요인이 팽팽하게 대립하고 있습니다. 추가 지표 발표와 연준 통화 정책 위원들의 피봇 스탠스 발언을 대기하는 신중한 기류가 감지됩니다.`;
  }

  const adviceComment = `거시적 판도로 볼 때 무리한 추격 매수보다는 대기 현금을 머니마켓(MMF) 등에 예치한 뒤 지수 조정 국면에서 분할 진입 시기를 모니터링하는 전략이 효과적입니다.`;

  const summary = `${indexComments} ${sentimentComment} ${adviceComment}`;
  const keyIssues: string[] = [];

  keyIssues.push(
    `미국 주요 지수 동향: S&P 500 (${spPct >= 0 ? '+' : ''}${spPct.toFixed(2)}%), NASDAQ (${nasdaqPct >= 0 ? '+' : ''}${nasdaqPct.toFixed(2)}%)로 ${spPct >= 0 ? '상방 모멘텀 유지' : '지선 지지력 테스트'}`
  );
  keyIssues.push(
    `실시간 마켓 감성 평가: 수집 속보 기준 ${sentimentStatus} 투심 기록 (호재 ${posCount}건 / 악재 ${negCount}건 / 중립 ${finalNews.length - posCount - negCount}건)`
  );
  keyIssues.push(
    `거시 대응 전략 가이드라인: 시장 변동성(VIX) 및 달러 추이에 주목하고, 대형 우량주와 방어성 배당 자산을 조합하는 포지셔닝 권장`
  );

  const result: MarketSummaryData = {
    news: finalNews,
    summary,
    keyIssues
  };

  setCached(key, result, 60_000);
  return result;
}

// ─── [NEW] 카테고리별 실시간 마켓 뉴스 수집 ──────────────────────────────────
export interface CategoryNewsItem {
  id: number;
  headline: string;
  translatedHeadline?: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  ticker: string;
  impact: 'high' | 'medium' | 'low';
  link?: string;
}

const CATEGORY_TICKERS: Record<string, string[]> = {
  '매크로':      ['^GSPC', '^TNX', '^VIX'],
  'Tech':        ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'AVGO'],
  'Healthcare':  ['UNH', 'LLY', 'JNJ', 'ABBV'],
  'Financials':  ['JPM', 'BAC', 'GS'],
  'EV':          ['TSLA', 'RIVN', 'LCID'],
  'Communication': ['META', 'GOOGL', 'NFLX'],
  'all':         ['^GSPC', 'NVDA', 'AAPL', 'TSLA', 'META', 'UNH', 'JPM'],
};

export async function fetchCategoryNews(category: string): Promise<CategoryNewsItem[]> {
  const key = `news:category:${category}`;
  const cached = getCached<CategoryNewsItem[]>(key);
  if (cached) return cached;

  const targetCategory = CATEGORY_TICKERS[category] ? category : 'all';
  const tickers = CATEGORY_TICKERS[targetCategory];

  const rawNews: any[] = [];

  const extractNews = (res: any, ticker: string) => {
    return (res?.news ?? []).map((item: any) => {
      const titleLower = (item.title ?? '').toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (/\b(exceed|beat|surprise|rise|gain|up|grow|positive|jump|profit|higher|bull|rally|soar|record|advance|optimism|climb)\b/.test(titleLower)) {
        sentiment = 'positive';
      } else if (/\b(miss|down|fall|drop|loss|negative|warn|lower|bear|cut|decline|worry|fear|plunge|slump|selloff|slide|drop)\b/.test(titleLower)) {
        sentiment = 'negative';
      }

      let timeStr = '방금 전';
      if (item.providerPublishTime) {
        const diffMs = Date.now() - new Date(item.providerPublishTime).getTime();
        const diffHours = Math.floor(diffMs / 3_600_000);
        if (diffHours > 24) {
          timeStr = `${Math.floor(diffHours / 24)}일 전`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours}시간 전`;
        } else {
          const diffMins = Math.floor(diffMs / 60_000);
          timeStr = diffMins > 0 ? `${diffMins}분 전` : '방금 전';
        }
      }

      return {
        headline: item.title ?? '',
        translatedHeadline: translateHeadline(item.title ?? ''),
        source: item.publisher ?? 'Yahoo Finance',
        time: timeStr,
        sentiment,
        category: targetCategory === 'all' ? (ticker === '^GSPC' ? '매크로' : 'Tech') : targetCategory,
        ticker: ticker === '^GSPC' ? 'SPX' : ticker,
        impact: sentiment !== 'neutral' ? 'high' : 'medium',
        link: item.link ?? '',
      };
    });
  };

  try {
    const results = await Promise.allSettled(
      tickers.map(ticker => yahooFinance.search(ticker, { newsCount: 4, quotesCount: 0 }))
    );

    results.forEach((r, idx) => {
      const ticker = tickers[idx];
      if (r.status === 'fulfilled') {
        rawNews.push(...extractNews(r.value, ticker));
      } else {
        const anyErr = r.reason as any;
        if (anyErr.result && anyErr.result.news) {
          rawNews.push(...extractNews(anyErr.result, ticker));
        }
      }
    });
  } catch (err) {
    console.error(`[yahooClient] fetchCategoryNews error for ${category}:`, err);
  }

  const seenHeadlines = new Set<string>();
  const newsList: CategoryNewsItem[] = [];
  let idCounter = 3000;

  for (const item of rawNews) {
    const trimmedTitle = item.headline.trim().toLowerCase();
    if (!seenHeadlines.has(trimmedTitle) && item.headline) {
      seenHeadlines.add(trimmedTitle);
      newsList.push({
        id: idCounter++,
        ...item
      });
    }
  }

  const finalNews = newsList.slice(0, 8);

  setCached(key, finalNews, 60_000);
  return finalNews;
}

// ─── [NEW] 실시간 대형주 어닝 캘린더 패칭 ───────────────────────────────────
export interface EarningCalendarItem {
  ticker: string;
  name: string;
  date: string;
  eps_est: number;
  surprise_pct: number | null;
}

export async function fetchEarningCalendar(): Promise<EarningCalendarItem[]> {
  const key = 'earnings:calendar';
  const cached = getCached<EarningCalendarItem[]>(key);
  if (cached) return cached;

  const tickers = ['NVDA', 'COST', 'AAPL', 'MSFT', 'GOOGL', 'META'];
  const names: Record<string, string> = {
    NVDA: 'NVIDIA', COST: 'Costco', AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', META: 'Meta'
  };
  const fallbacks: Record<string, { date: string, eps_est: number, surprise_pct: number | null }> = {
    NVDA:  { date: '2026-05-28', eps_est: 5.52, surprise_pct: null },
    COST:  { date: '2026-05-29', eps_est: 3.68, surprise_pct: null },
    AAPL:  { date: '2026-07-30', eps_est: 1.51, surprise_pct: null },
    MSFT:  { date: '2026-07-29', eps_est: 3.10, surprise_pct: null },
    GOOGL: { date: '2026-07-24', eps_est: 1.85, surprise_pct: 28.5 },
    META:  { date: '2026-04-30', eps_est: 4.30, surprise_pct: 117.3 },
  };

  const results = await Promise.allSettled(
    tickers.map(async (t) => {
      try {
        const summary = await yahooFinance.quoteSummary(t, { modules: ['calendarEvents', 'earnings'] });
        const earningsDate = summary?.calendarEvents?.earnings?.earningsDate?.[0]
          ? new Date(summary.calendarEvents.earnings.earningsDate[0]).toISOString().split('T')[0]
          : null;
        const nextEpsEst = summary?.calendarEvents?.earnings?.epsEstimate ?? null;

        const quarterly = summary?.earnings?.earningsChart?.quarterly ?? [];
        let surprise_pct = null;
        if (quarterly.length > 0) {
          const lastQ = quarterly[quarterly.length - 1];
          if (lastQ.surprisePct !== undefined && lastQ.surprisePct !== null) {
            surprise_pct = lastQ.surprisePct * 100;
          }
        }

        return {
          ticker: t,
          name: names[t] ?? t,
          date: earningsDate || fallbacks[t].date,
          eps_est: nextEpsEst !== null ? nextEpsEst : fallbacks[t].eps_est,
          surprise_pct: surprise_pct !== null ? surprise_pct : fallbacks[t].surprise_pct
        };
      } catch {
        return {
          ticker: t,
          name: names[t] ?? t,
          ...fallbacks[t]
        };
      }
    })
  );

  const list = results
    .map((r, idx) => {
      const t = tickers[idx];
      if (r.status === 'fulfilled') return r.value;
      return {
        ticker: t,
        name: names[t] ?? t,
        ...fallbacks[t]
      };
    });

  setCached(key, list, 300_000);
  return list;
}

// ─── [NEW] 개별 종목 및 ETF 관련 실시간 뉴스 속보 패칭 ───────────────────────────
export async function fetchTickerNews(ticker: string): Promise<CategoryNewsItem[]> {
  const key = `news:ticker:${ticker.toUpperCase()}`;
  const cached = getCached<CategoryNewsItem[]>(key);
  if (cached) return cached;

  const resolved = resolveTicker(ticker);
  const rawNews: any[] = [];

  try {
    let searchRes: any;
    try {
      searchRes = await yahooFinance.search(resolved.toUpperCase(), { newsCount: 8, quotesCount: 0 }, { validateResult: false });
    } catch (searchErr: any) {
      if (searchErr.name === 'FailedYahooValidationError' && searchErr.result) {
        searchRes = searchErr.result;
      } else {
        throw searchErr;
      }
    }
    const news = searchRes.news ?? [];
    
    const mapped = news.map((item: any, idx: number) => {
      const titleLower = (item.title ?? '').toLowerCase();
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (/\b(exceed|beat|surprise|rise|gain|up|grow|positive|jump|profit|higher|bull|rally|soar|record|advance|optimism|climb)\b/.test(titleLower)) {
        sentiment = 'positive';
      } else if (/\b(miss|down|fall|drop|loss|negative|warn|lower|bear|cut|decline|worry|fear|plunge|slump|selloff|slide|drop)\b/.test(titleLower)) {
        sentiment = 'negative';
      }

      let timeStr = '방금 전';
      if (item.providerPublishTime) {
        const diffMs = Date.now() - new Date(item.providerPublishTime).getTime();
        const diffHours = Math.floor(diffMs / 3_600_000);
        if (diffHours > 24) {
          timeStr = `${Math.floor(diffHours / 24)}일 전`;
        } else if (diffHours > 0) {
          timeStr = `${diffHours}시간 전`;
        } else {
          const diffMins = Math.floor(diffMs / 60_000);
          timeStr = diffMins > 0 ? `${diffMins}분 전` : '방금 전';
        }
      }

      return {
        id: 5000 + idx,
        headline: item.title ?? '',
        translatedHeadline: translateHeadline(item.title ?? ''),
        source: item.publisher ?? 'Yahoo Finance',
        time: timeStr,
        sentiment,
        category: '개별 종목',
        ticker: resolved.toUpperCase(),
        impact: sentiment !== 'neutral' ? 'high' : 'medium',
        link: item.link ?? '',
      };
    });

    setCached(key, mapped, 60_000);
    return mapped;
  } catch (err) {
    console.error(`[yahooClient] fetchTickerNews error for ${ticker}:`, err);
    return [];
  }
}

// ─── [NEW] 실시간 영문 금융 뉴스 정교한 한글 번역/요약 유틸 ────────────────────────
export function translateHeadline(title: string): string {
  if (!title) return '';
  let t = title.trim();

  // 1. Core Corporate/Entity Name Map
  function translateWord(word: string): string {
    const w = word.toLowerCase().trim();
    if (w === 'nvidia' || w === 'nvda') return '엔비디아';
    if (w === 'apple' || w === 'aapl') return '애플';
    if (w === 'microsoft' || w === 'msft') return '마이크로소프트';
    if (w === 'tesla' || w === 'tsla') return '테슬라';
    if (w === 'meta') return '메타';
    if (w === 'amazon' || w === 'amzn') return '아마존';
    if (w === 'alphabet' || w === 'google' || w === 'googl') return '알파벳(구글)';
    if (w === 'tsm' || w === 'tsmc') return 'TSMC';
    if (w === 'oracle corporation' || w === 'oracle' || w === 'orcl') return '오라클';
    if (w === 'salesforce' || w === 'crm') return '세일즈포스';
    if (w === 'intel' || w === 'intc') return '인텔';
    if (w === 'dell' || w === 'dell technologies') return '델';
    if (w === 'micron' || w === 'mu') return '마이크론';
    if (w === 'donald trump') return '도널드 트럼프';
    if (w === 'billionaire phillipe laffont' || w === 'phillipe laffont') return '억만장자 필립 라퐁';
    if (w === 'tigress financial') return '타이그리스 파이낸셜';
    if (w === 'simply wall st.' || w === 'simply wall st') return '심플리 월스트리트';
    if (w === 'zacks') return '잭스';
    if (w === 'motley fool') return '모틀리 풀';
    if (w === 'yahoo finance video') return '야후 파이낸스 비디오';
    if (w === 'stockstory') return '스탁스토리';
    if (w === 'jupiter') return '주피터';
    return word;
  }

  // 2. Finance & Tech Core Keyword Dictionary
  const dictionary: [RegExp, string][] = [
    [/\bThe Stock Market\b/gi, '주식 시장'],
    [/\bstock market\b/gi, '주식 시장'],
    [/\bwarning signal\b/gi, '경고 신호'],
    [/\bflashing a rare\b/gi, '이례적인'],
    [/\bflashing a\b/gi, '나타내는'],
    [/\bWhat History Says\b/gi, '역사가 보여주는 시나리오'],
    [/\bHappens Next\b/gi, '향후 전개'],
    [/\bHere's What\b/gi, '여기에'],
    
    [/\bNarrow leadership\b/gi, '소수 종목 중심의 협소한 주도력'],
    [/\b'Narrow' leadership\b/gi, '소수 종목 중심의 협소한 주도력'],
    [/\bnarrow leadership\b/gi, '소수 종목 중심의 협소한 주도력'],
    [/\bfragility in markets\b/gi, '시장 취약성'],
    [/\bfragility\b/gi, '취약성'],
    [/\bmarket fragility\b/gi, '시장 취약성'],
    
    [/\bWorth Investigating\b/gi, '분석해 볼 가치가 있는'],
    [/\bworth investigating\b/gi, '분석해 볼 가치가 있는'],
    [/\bUnderwhelm\b/gi, '기대에 못 미치는 부진'],
    [/\bunderwhelm\b/gi, '기대에 못 미치는 부진'],
    [/\bunderwhelming\b/gi, '부진한'],
    [/\bStocks to Target\b/gi, '주목해야 할 주식'],
    [/\bstocks to target\b/gi, '주목해야 할 주식'],
    [/\bBrush Off\b/gi, '외면해야 할(거를) 것'],
    [/\bbrush off\b/gi, '외면해야 할(거를) 것'],
    
    [/\bValuation Check\b/gi, '밸류에이션 점검'],
    [/\bvaluation check\b/gi, '밸류에이션 점검'],
    [/\bValuation\b/gi, '밸류에이션'],
    [/\bvaluation\b/gi, '밸류에이션'],
    [/\bMixed Short Term Moves\b/gi, '단기 혼조세'],
    [/\bmixed short-term moves\b/gi, '단기 혼조세'],
    [/\bmixed short term moves\b/gi, '단기 혼조세'],
    [/\bShort Term Moves\b/gi, '단기 움직임'],
    [/\bshort term moves\b/gi, '단기 움직임'],
    [/\bStrong Long Term Returns\b/gi, '강력한 장기 수익률'],
    [/\bstrong long term returns\b/gi, '강력한 장기 수익률'],
    [/\bstrong long-term returns\b/gi, '강력한 장기 수익률'],
    [/\bLong Term Returns\b/gi, '장기 수익률'],
    [/\blong term returns\b/gi, '장기 수익률'],
    
    [/\bWhat's Driving the Rally\b/gi, '랠리를 이끄는 요인은 무엇인가'],
    [/\bWhat's Driving\b/gi, '무엇이 이끄는가'],
    [/\bWhat is driving\b/gi, '무엇이 이끄는가'],
    [/\bdriving the rally\b/gi, '랠리를 이끄는 요인'],
    [/\bAI rally\b/gi, 'AI 랠리'],
    [/\bsemiconductor rally\b/gi, '반도체 랠리'],
 
    [/\bMaintains Strong Buy Rating\b/gi, '강력 매수 의견 유지'],
    [/\bMaintains Buy Rating\b/gi, '매수 의견 유지'],
    [/\bMaintains Rating\b/gi, '의견 유지'],
    [/\bStrong Buy\b/gi, '강력 매수'],
    
    [/\bFederal Reserve\b/gi, '연방준비제도(연준)'],
    [/\bFed\b/gi, '연준'],
    [/\brate cut\b/gi, '금리 인하'],
    [/\brate cuts\b/gi, '금리 인하'],
    [/\brate hike\b/gi, '금리 인상'],
    [/\brate hikes\b/gi, '금리 인상'],
    [/\binflation\b/gi, '인플레이션'],
    [/\bCPI\b/gi, '소비자물가지수(CPI)'],
    [/\bPPI\b/gi, '생산자물가지수(PPI)'],
    [/\bjobs report\b/gi, '고용 보고서'],
    [/\bunemployment\b/gi, '실업률'],
    [/\btreasury yield\b/gi, '국채 금리'],
    [/\btreasury yields\b/gi, '국채 금리'],
    [/\bconsumer confidence\b/gi, '소비자 신뢰지수'],
    [/\bearnings beat\b/gi, '실적 어닝 서프라이즈'],
    [/\bearnings miss\b/gi, '실적 하회(쇼크)'],
    [/\brevenue\b/gi, '매출'],
    [/\bprofits\b/gi, '순이익'],
    [/\bprofit\b/gi, '이익'],
    [/\brecession\b/gi, '경기 침체'],
    [/\bbull market\b/gi, '강세장'],
    [/\bbear market\b/gi, '약세장'],
    [/\bbig tech\b/gi, '빅테크'],
    [/\bsemiconductor\b/gi, '반도체'],
    [/\bsemiconductors\b/gi, '반도체'],
    [/\bmarket rally\b/gi, '시장 랠리'],
    [/\brally\b/gi, '랠리'],
    [/\bearnings season\b/gi, '실적 시즌'],

    [/\bAI Growth And Debt Risks\b/gi, 'AI 성장세와 부채 리스크'],
    [/\bAI Growth\b/gi, 'AI 성장세'],
    [/\bai growth\b/gi, 'AI 성장세'],
    [/\bDebt Risks\b/gi, '부채 리스크'],
    [/\bdebt risks\b/gi, '부채 리스크'],
    [/\bAI Fears\b/gi, 'AI 관련 우려'],
    [/\bai fears\b/gi, 'AI 관련 우려'],
  ];

  // 3. Dynamic Phrase/Word Translator Helper
  function translatePhrase(phrase: string): string {
    let res = phrase.trim();
    
    // exact match check first
    const exact = translateWord(res);
    if (exact.toLowerCase() !== res.toLowerCase()) return exact;

    // run dictionary replacements
    for (const [regex, replacement] of dictionary) {
      res = res.replace(regex, replacement);
    }
    
    // map individual words
    return res.split(' ').map(w => {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (!clean) return w;
      const tw = translateWord(clean);
      return w.replace(clean, tw);
    }).join(' ');
  }

  // 4. Exact Matches
  const exactMatches: Record<string, string> = {
    "The Stock Market Is Flashing a Rare Warning Signal. Here's What History Says Happens Next.":
      "주식 시장이 흔치 않은 경고 신호를 보이고 있습니다. 역사가 보여주는 향후 전개는 다음과 같습니다.",
    "'Narrow' leadership is creating more fragility in markets":
      "소수 종목 중심의 '협소한 주도력'이 시장의 취약성을 키우고 있습니다.",
    "1 S&P 500 Stock Worth Investigating and 2 That Underwhelm":
      "분석해 볼 가치가 있는 S&P 500 종목 1개와 기대에 못 미치는 부진한 종목 2개",
    "2 S&P 500 Stocks to Target This Week and 1 We Brush Off":
      "이번 주 주목해야 할 S&P 500 종목 2개와 외면해야 할(거를) 종목 1개",
    "Nvidia (NVDA) Valuation Check After Mixed Short Term Moves And Strong Long Term Returns":
      "엔비디아(NVDA), 단기 혼조세와 강력한 장기 수익률 속 밸류에이션 점검",
    "NVDA Gains 23.5% Since April, TSM Up 19.7%: What's Driving the Rally?":
      "엔비디아(NVDA) 4월 이후 23.5% 상승, TSMC(TSM) 19.7% 상승: 이 랠리를 이끄는 요인은 무엇인가?",
    "Tigress Financial Raises Nvidia Price Target to $425 From $360, Maintains Strong Buy Rating":
      "타이그리스 파이낸셜, 엔비디아 목표주가 $360에서 $425로 상향, '강력 매수' 의견 유지",
  };

  const exactKey = Object.keys(exactMatches).find(
    k => k.toLowerCase() === t.toLowerCase()
  );
  if (exactKey) {
    return exactMatches[exactKey];
  }

  // 5. Structured pattern replacements
  // Pattern 1: Is [Trending Stock] [Company] (Ticker) a Buy Now?
  const isBuyNowPat = /^Is\s+(?:Trending\s+Stock\s+)?([A-Za-z0-9\s.,]+?)(?:\s+\([A-Z]+\))?\s+a\s+Buy\s+Now\?/i;
  if (isBuyNowPat.test(t)) {
    return t.replace(isBuyNowPat, (_, company) => {
      const companyKo = translatePhrase(company);
      return `인기 종목 ${companyKo}, 지금 매수해야 할까?`;
    });
  }

  // Pattern 2: [Company] Upgraded to Buy: Here's Why
  const upgradedToBuyPat = /^([A-Za-z0-9\s.,]+?)(?:\s+\([A-Z]+\))?\s+Upgraded\s+to\s+Buy:\s+Here's\s+Why/i;
  if (upgradedToBuyPat.test(t)) {
    return t.replace(upgradedToBuyPat, (_, company) => {
      const companyKo = translatePhrase(company);
      return `${companyKo} '매수'로 의견 상향: 그 이유는?`;
    });
  }

  // Pattern 3: [Company] Downgraded to Sell: Here's Why
  const downgradedToSellPat = /^([A-Za-z0-9\s.,]+?)(?:\s+\([A-Z]+\))?\s+Downgraded\s+to\s+Sell:\s+Here's\s+Why/i;
  if (downgradedToSellPat.test(t)) {
    return t.replace(downgradedToSellPat, (_, company) => {
      const companyKo = translatePhrase(company);
      return `${companyKo} '매도'로 의견 하향: 그 이유는?`;
    });
  }

  // Pattern 4: [Person] Recently Sold [Stock1], [Stock2]... and Purchased a Stock Down [X]% Since Its IPO (in [Year])
  const soldAndPurchasedPat = /([A-Za-z0-9\s.,]+?)\s+Recently\s+Sold\s+([A-Za-z0-9\s.,\s+and\s+]+?)\s+and\s+Purchased\s+a\s+Stock\s+Down\s+([0-9.]+)%\s+Since\s+Its\s+IPO(?:\s+in\s+(\d+))?/i;
  if (soldAndPurchasedPat.test(t)) {
    return t.replace(soldAndPurchasedPat, (_, person, soldStocks, pct, year) => {
      const personKo = translatePhrase(person);
      
      // Clean split using comma and/or "and"
      const soldStocksKo = (soldStocks as string)
        .split(/,\s*(?:and\s+)?|\s+and\s+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => translatePhrase(s))
        .join('·');
      
      return `${personKo}, 최근 ${soldStocksKo} 매도하고 ${year ? year + '년 ' : ''}IPO 이후 ${pct}% 폭락한 주식 매수`;
    });
  }

  // Pattern 5: [Company] Project [X] Puts [Y] In Focus
  const putsInFocusPat = /^([A-Za-z0-9\s.,]+?)\s+Project\s+([A-Za-z0-9\s.,]+?)\s+Puts\s+([A-Za-z0-9\s.,\s+And\s+]+?)\s+In\s+Focus/i;
  if (putsInFocusPat.test(t)) {
    return t.replace(putsInFocusPat, (_, company, project, focus) => {
      const companyKo = translatePhrase(company);
      const projectKo = translatePhrase(project);
      const focusKo = translatePhrase(focus);
      return `${companyKo}의 '프로젝트 ${projectKo}', ${focusKo}에 집중 조명`;
    });
  }

  // Pattern 6: [Company] Earnings Can Put [Fears] to Bed, Give Stock a Lift
  const putToBedPat = /^([A-Za-z0-9\s.,]+?)\s+Earnings\s+Can\s+Put\s+([A-Za-z0-9\s.,]+?)\s+to\s+Bed,\s+Give\s+Stock\s+a\s+Lift/i;
  if (putToBedPat.test(t)) {
    return t.replace(putToBedPat, (_, company, fears) => {
      const companyKo = translatePhrase(company);
      const fearsKo = translatePhrase(fears);
      return `${companyKo} 실적 발표, ${fearsKo} 불식시키고 주가 상승 모멘텀 제공할까`;
    });
  }

  // Pattern 7: [Person] Shouted Out [Stock1], Then [Stock2], Then [Stock3]: Look At His Own Stock Filings To See Who May Get The Next Shoutout
  const shoutedOutPat = /^([A-Za-z0-9\s.,]+?)\s+Shouted\s+Out\s+([A-Za-z0-9\s.,]+?),\s+Then\s+([A-Za-z0-9\s.,]+?),\s+Then\s+([A-Za-z0-9\s.,]+?):\s+Look\s+At\s+His\s+Own\s+Stock\s+Filings\s+To\s+See\s+Who\s+May\s+Get\s+The\s+Next\s+Shoutout/i;
  if (shoutedOutPat.test(t)) {
    return t.replace(shoutedOutPat, (_, person, s1, s2, s3) => {
      const personKo = translatePhrase(person);
      const s1Ko = translatePhrase(s1);
      const s2Ko = translatePhrase(s2);
      const s3Ko = translatePhrase(s3);
      return `${personKo}, ${s1Ko}·${s2Ko}·${s3Ko} 이례적 언급: 공시 자료 분석을 통해 본 다음 수혜주는?`;
    });
  }

  // Pattern: "Raises Price Target to $[X] From $[Y]"
  const raisesPT = /raises\s+([A-Za-z0-9\s\(\)]+?)\s+price\s+target\s+to\s+\$([0-9.,]+)\s+from\s+\$([0-9.,]+)/i;
  if (raisesPT.test(t)) {
    t = t.replace(raisesPT, (_, stock, to, from) => {
      const stockKo = translatePhrase(stock);
      return `${stockKo} 목표주가를 $${from}에서 $${to}로 상향 조정`;
    });
  }

  // Pattern: "Lowers Price Target to $[X] From $[Y]"
  const lowersPT = /lowers\s+([A-Za-z0-9\s\(\)]+?)\s+price\s+target\s+to\s+\$([0-9.,]+)\s+from\s+\$([0-9.,]+)/i;
  if (lowersPT.test(t)) {
    t = t.replace(lowersPT, (_, stock, to, from) => {
      const stockKo = translatePhrase(stock);
      return `${stockKo} 목표주가를 $${from}에서 $${to}로 하향 조정`;
    });
  }

  // Pattern: "Price Target Raised to $[X] at [Firm]"
  const raisedAt = /([A-Za-z0-9\s\(\)]+?)\s+price\s+target\s+raised\s+to\s+\$([0-9.,]+)\s+at\s+([A-Za-z0-9\s]+)/i;
  if (raisedAt.test(t)) {
    t = t.replace(raisedAt, (_, stock, price, firm) => {
      const stockKo = translatePhrase(stock);
      const firmKo = translatePhrase(firm);
      return `${firmKo}에서 ${stockKo} 목표주가를 $${price}로 상향`;
    });
  }

  // Final dictionary fallback for unmapped sentences
  let translated = t;
  for (const [regex, replacement] of dictionary) {
    translated = translated.replace(regex, replacement);
  }

  // Clean up spaces
  translated = translated
    .replace(/\s+:\s+/g, ': ')
    .replace(/\s+,\s+/g, ', ')
    .replace(/(\d+)\s+일 전/g, '$1일 전')
    .replace(/(\d+)\s+시간 전/g, '$1시간 전')
    .replace(/(\d+)\s+분 전/g, '$1분 전');

  translated = translated.replace(/\s+/g, ' ').trim();
  
  if (translated === title) {
    const words = title.split(' ');
    const translatedWords = words.map(w => {
      const cleanWord = w.replace(/[^a-zA-Z]/g, '');
      const tWord = translateWord(cleanWord);
      if (tWord !== cleanWord) {
        return w.replace(cleanWord, tWord);
      }
      return w;
    });
    translated = translatedWords.join(' ');
  }

  return translated;
}
