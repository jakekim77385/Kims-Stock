/**
 * hooks.ts — API 데이터 페칭 훅
 * React 내장 useState + useEffect 기반 (SWR 미사용)
 * 폴링: 60초마다 자동 갱신
 */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── 공통 ─────────────────────────────────────────────────────────────────────
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function usePoll<T>(
  fetcher: () => Promise<T>,
  intervalMs = 60_000,
  key = ''
): FetchState<T> {
  const [data, setData]     = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const timerRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetcherRef          = useRef(fetcher);

  // 항상 최신의 fetcher 참조 유지
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetch_ = useCallback(async (isReset = false) => {
    if (isReset) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setData(null); // 실패 시 이전 데이터 초기화 (stale 데이터 누수 방지)
    } finally {
      setLoading(false);
    }
  }, []);

  // 고유 key 변경 시에만 상태 초기화 및 페칭 수행 (인라인 함수 재생성으로 인한 무한 렌더링 루프 방지)
  useEffect(() => {
    setData(null);
    fetch_(true);
  }, [key]);

  // 폴링 핸들러
  useEffect(() => {
    timerRef.current = setInterval(() => fetch_(false), intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch_, intervalMs]);

  return { data, loading, error, refresh: () => fetch_(true) };
}

// ─── 지수 ─────────────────────────────────────────────────────────────────────
export interface MarketIndex {
  name:      string;
  ticker:    string;
  value:     number;
  change:    number;
  changePct: number;
}

export interface MarketNews {
  id: number;
  headline: string;
  translatedHeadline?: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium';
  link?: string;
}

export interface MarketData {
  indices:   MarketIndex[];
  news:      MarketNews[];
  summary:   string;
  keyIssues: string[];
  updatedAt: string;
}

export function useMarket(intervalMs = 60_000) {
  return usePoll<MarketData>(
    async () => {
      const res = await fetch('/api/market');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    intervalMs,
    'market'
  );
}

// ─── 단일 종목 ────────────────────────────────────────────────────────────────
export interface StockQuote {
  ticker:    string;
  name:      string;
  price:     number;
  change:    number;
  changePct: number;
  volume:    number;
  marketCap: number;
  pe:        number | null;
  high52w:   number;
  low52w:    number;
  avgVolume: number;
  open:      number;
  prevClose: number;
  currency:  string;
  exchange:  string;
  timestamp: number;
  change1wPct?: number | null;
  price1wAgo?:  number | null;
}

export function useQuote(ticker: string, intervalMs = 60_000) {
  const fetcher = useCallback(async () => {
    const res = await fetch(`/api/quote/${ticker.toUpperCase()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.quote as StockQuote;
  }, [ticker]);

  return usePoll<StockQuote>(fetcher, intervalMs, ticker);
}

// ─── 복수 종목 ────────────────────────────────────────────────────────────────
export function useQuotes(tickers?: string[], intervalMs = 60_000) {
  const fetcher = useCallback(async () => {
    const url = tickers?.length
      ? `/api/quotes?tickers=${tickers.join(',')}`
      : '/api/quotes';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.quotes as StockQuote[];
  }, [tickers]);

  return usePoll<StockQuote[]>(fetcher, intervalMs, tickers?.join(',') ?? 'quotes');
}

// ─── 히스토리 ─────────────────────────────────────────────────────────────────
export interface HistoryBar {
  date:   string;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export type HistoryPeriod = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

export function useHistory(
  ticker: string,
  period: HistoryPeriod = '6mo',
  intervalMs = 300_000  // 5분
) {
  const fetcher = useCallback(async () => {
    const res = await fetch(`/api/history/${ticker.toUpperCase()}?period=${period}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.bars as HistoryBar[];
  }, [ticker, period]);

  return usePoll<HistoryBar[]>(fetcher, intervalMs, `${ticker}:${period}`);
}

// ─── 검색 ─────────────────────────────────────────────────────────────────────
export interface SearchResult {
  ticker:   string;
  name:     string;
  exchange: string;
  type:     string;
}

export function useSearch(query: string) {
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (!cancelled) setResults(json.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250); // 250ms debounce

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return { results, loading };
}

// ─── 전체 자산 비교표 ──────────────────────────────────────────────────────────
export interface AssetRow {
  category:  string;
  name:      string;
  ticker:    string;
  symbol:    string;
  value:     number;
  change:    number;
  changePct: number;
  high52w:   number;
  low52w:    number;
  open:      number;
  prevClose: number;
  unit:      string;
}

export interface ComparisonData {
  rows:      AssetRow[];
  updatedAt: string;
}

export function useComparison(intervalMs = 60_000) {
  return usePoll<ComparisonData>(
    async () => {
      const res = await fetch('/api/comparison');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    intervalMs,
    'comparison'
  );
}

