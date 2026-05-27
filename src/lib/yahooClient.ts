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
  const clean = ticker.trim().toUpperCase();
  const lower = clean.toLowerCase();

  // 한국어 매핑 탐색 (완전 일치 또는 포함 관계)
  const matchKey = Object.keys(KOREAN_STOCK_MAP).find(
    (k) => k === lower || k.includes(lower) || lower.includes(k)
  );

  return matchKey ? KOREAN_STOCK_MAP[matchKey] : clean;
}

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
}

export async function fetchQuote(ticker: string): Promise<QuoteResult | null> {
  const resolved = resolveTicker(ticker);
  const key = `quote:${resolved.toUpperCase()}`;
  const cached = getCached<QuoteResult>(key);
  if (cached) return cached;

  try {
    const q = await yahooFinance.quote(resolved.toUpperCase());
    if (!q) return null;

    const result: QuoteResult = {
      ticker:    q.symbol,
      name:      q.longName ?? q.shortName ?? q.symbol,
      price:     q.regularMarketPrice ?? 0,
      change:    q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
      volume:    q.regularMarketVolume ?? 0,
      marketCap: q.marketCap ?? 0,
      pe:        q.trailingPE ?? null,
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

    setCached(key, result, 60_000);
    return result;
  } catch (err) {
    console.error(`[yahooClient] fetchQuote error for ${ticker}:`, err);
    return null;
  }
}

// ─── 복수 종목 배치 시세 ─────────────────────────────────────────────────────
export async function fetchQuotes(tickers: string[]): Promise<QuoteResult[]> {
  const upper  = tickers.map((t) => resolveTicker(t).toUpperCase());
  const key    = `quotes:${upper.slice().sort().join(',')}`;
  const cached = getCached<QuoteResult[]>(key);
  if (cached) return cached;

  const results = await Promise.allSettled(upper.map(fetchQuote));
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
    const res = await yahooFinance.search(resolvedQuery, { newsCount: 0, quotesCount: 10 });
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
