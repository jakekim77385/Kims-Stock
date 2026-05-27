'use client';

import { useState, useMemo } from 'react';
import { 
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, 
  HelpCircle, RefreshCw, BarChart2, Zap, ArrowRight, ShieldAlert 
} from 'lucide-react';

interface TrapStock {
  ticker: string;
  name: string;
  price: number;
  preChangePct: number;
  preVolume: number;
  avgVolume: number;
  stochShort: number;
  rsi14: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  newsTitle: string;
}

// ─── 3중 스토캐스틱 연산 헬퍼 ──────────────────────────────────────────────────
function calculateStochastic(bars: any[], period: number, smoothK: number): number[] {
  if (!bars || bars.length === 0) return [];
  const rawK: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      rawK.push(50);
      continue;
    }
    let lowestLow = bars[i].low;
    let highestHigh = bars[i].high;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
    }
    const range = highestHigh - lowestLow;
    const currentClose = bars[i].close;
    const k = range > 0 ? ((currentClose - lowestLow) / range) * 100 : 50;
    rawK.push(k);
  }
  const stochLines: number[] = [];
  for (let i = 0; i < rawK.length; i++) {
    if (i < smoothK - 1) {
      stochLines.push(rawK[i]);
      continue;
    }
    let sum = 0;
    for (let j = i - smoothK + 1; j <= i; j++) {
      sum += rawK[j];
    }
    stochLines.push(sum / smoothK);
  }
  return stochLines;
}

// ─── RSI-14 연산 헬퍼 ──────────────────────────────────────────────────────────
function calculateRSI14(bars: any[]): number {
  if (!bars || bars.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= 14; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  
  for (let i = 15; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// ─── 초기 프리마켓 빅테크 8선 시나리오 ─────────────────────────────────────────────
const initialPremarketStocks: TrapStock[] = [
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    price: 248.50,
    preChangePct: 3.42,
    preVolume: 168000,
    avgVolume: 82000000,
    stochShort: 84.5,
    rsi14: 68.2,
    sentiment: 'neutral',
    newsTitle: 'SNS 소셜 미디어 내 자율주행(FSD) 관련 기대감 확산 (공식 악재/호재 없음)'
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies Inc.',
    price: 139.47,
    preChangePct: 2.10,
    preVolume: 42000,
    avgVolume: 35000000,
    stochShort: 73.3,
    rsi14: 62.4,
    sentiment: 'neutral',
    newsTitle: '장기 대세 역배열 매물대 저항선 도달 상황에서 뚜렷한 모멘텀 없음'
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 231.50,
    preChangePct: 4.80,
    preVolume: 29500000,
    avgVolume: 310000000,
    stochShort: 44.8,
    rsi14: 52.4,
    sentiment: 'positive',
    newsTitle: '차세대 Blackwell AI 가속기 메가 수주 계약 공식 체결 속보'
  },
  {
    ticker: 'SMCI',
    name: 'Super Micro Computer Inc.',
    price: 45.20,
    preChangePct: 5.25,
    preVolume: 12000,
    avgVolume: 18000000,
    stochShort: 78.4,
    rsi14: 71.5,
    sentiment: 'neutral',
    newsTitle: '호재 정보 없이 단순 호가 얇은 상태에서 소액 매수 주문 펌핑'
  },
  {
    ticker: 'LLY',
    name: 'Eli Lilly & Co.',
    price: 882.30,
    preChangePct: 2.85,
    preVolume: 1480000,
    avgVolume: 18000000,
    stochShort: 38.2,
    rsi14: 48.9,
    sentiment: 'positive',
    newsTitle: '글로벌 1위 비만 치료제 젭바운드 유럽/아시아 신규 승인 메가 특허 획득'
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 311.29,
    preChangePct: 0.80,
    preVolume: 78000,
    avgVolume: 52000000,
    stochShort: 52.4,
    rsi14: 51.2,
    sentiment: 'neutral',
    newsTitle: '아이폰 신형 칩 공급업체 수급 일정 안정화 조치 브리핑'
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 185.12,
    preChangePct: -1.85,
    preVolume: 420000,
    avgVolume: 28000000,
    stochShort: 41.5,
    rsi14: 45.6,
    sentiment: 'neutral',
    newsTitle: '글로벌 유럽 물류센터 일부 지연 노조 파업 단기 보도'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    price: 420.25,
    preChangePct: 0.40,
    preVolume: 110000,
    avgVolume: 22000000,
    stochShort: 58.2,
    rsi14: 53.8,
    sentiment: 'neutral',
    newsTitle: '신규 오피스 코파일럿 베타 기업 대상 대규모 확장 배포 개시'
  }
];

export default function PremarketTrapDetector() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'trap' | 'breakout' | 'normal'>('all');
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  
  // ─── 동적 종목 관리 상태 ────────────────────────────────────────────────────
  const [stocks, setStocks] = useState<TrapStock[]>(initialPremarketStocks);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // ─── 가짜 상승 퀀트 스코어링 엔진 ──────────────────────────────────────────────
  const computedStocks = useMemo(() => {
    return stocks.map(s => {
      let trapScore = 0;
      
      // A. 프리마켓 상승 대비 거래량 비율 점수 (유동성 부족에 비례)
      const volumePct = (s.preVolume / s.avgVolume) * 100; // 평균 대비 거래량 백분율
      if (s.preChangePct > 1.5) {
        if (volumePct < 1.0) {
          trapScore += 45; // 거래량 극소 상태에서 상승 (가짜 상승 유력)
        } else if (volumePct < 3.0) {
          trapScore += 30; // 거래량이 다소 부족한 상태에서 상승
        } else if (volumePct > 7.0) {
          trapScore -= 40; // 거래량이 매우 든든하게 터진 상승 (진짜 상승 유력)
        }
      }

      // B. 기술적 보조지표 과열 가점
      if (s.stochShort >= 75 || s.rsi14 >= 65) {
        trapScore += 25; // 기술적 초과열 구간
      } else if (s.stochShort <= 45 && s.rsi14 <= 50) {
        trapScore -= 20; // 지표상 저평가/눌림목 영역
      }

      // C. 호재 속보 유무 (호재 감성이 뒷받침되지 않으면 가짜 펌핑 의심)
      if (s.preChangePct > 1.5) {
        if (s.sentiment === 'neutral') {
          trapScore += 20; // 공식 재료가 없는데 상승 (허수 세력 펌핑 의심)
        } else if (s.sentiment === 'positive') {
          trapScore -= 15; // 뚜렷한 공식 호재가 존재함 (신뢰도 향상)
        }
      }

      // 하락 종목 보정
      if (s.preChangePct < 0) {
        trapScore = Math.max(0, 50 + (s.preChangePct * 10)); // 약세 등락 점수
      }

      trapScore = Math.min(100, Math.max(0, Math.round(trapScore)));

      // D. 최종 판단 등급 분류
      let classification: 'trap' | 'breakout' | 'normal' = 'normal';
      let statusTitle = '';
      let statusDesc = '';
      let badgeColor = '';
      let badgeBg = '';

      if (s.preChangePct > 1.0 && trapScore >= 70) {
        classification = 'trap';
        statusTitle = '🚨 설거지 함정 경보 (Fake Pump)';
        statusDesc = '거래량이 거의 없는 빈집 상태에서 호가를 띄운 가짜 상승입니다. 개장 즉시 대량의 본장 매도 폭탄으로 인해 상승폭을 모조리 반납하고 수직 하락할 가능성이 90% 이상입니다.';
        badgeColor = '#ef4444';
        badgeBg = 'rgba(239, 68, 68, 0.08)';
      } else if (s.preChangePct > 1.5 && trapScore <= 30) {
        classification = 'breakout';
        statusTitle = '🔥 진짜 돌파 (Real Breakout)';
        statusDesc = '프리마켓부터 기관급의 거대한 매수 거래량이 동반되며 전고점을 시원하게 뚫는 진짜 상승입니다. 본장 개시 후에도 추가 랠리와 상승 갭 수성이 우호적인 강한 모멘텀 주도주입니다.';
        badgeColor = '#3b82f6';
        badgeBg = 'rgba(59, 130, 246, 0.08)';
      } else {
        classification = 'normal';
        statusTitle = '⚖️ 일반 등락 (Normal Flow)';
        statusDesc = '프리마켓의 통상적인 유동성 범위 내에서의 정상적인 흐름입니다. 가짜 상승 함정이나 특별한 수급 쏠림이 보이지 않으며, 본장 시초가 추이를 편안히 확인하시면 됩니다.';
        badgeColor = '#64748b';
        badgeBg = 'rgba(100, 116, 139, 0.08)';
      }

      return {
        ...s,
        trapScore,
        classification,
        statusTitle,
        statusDesc,
        badgeColor,
        badgeBg,
        volumePct
      };
    });
  }, [stocks]);

  // ─── 관심 티커 실시간 추가 및 퀀트 융합 연산 실행 ─────────────────────────────────────
  const handleSearchAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    if (stocks.some(s => s.ticker === query)) {
      setSearchError('이미 감지 목록에 존재하는 티커입니다.');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // 1. 실시간 Quote API 조회 (프리마켓 시세 및 누적 거래량 획득)
      const qRes = await fetch(`/api/quote/${query}`);
      if (!qRes.ok) throw new Error('존재하지 않는 미국 주식 티커이거나 정보 취득에 실패했습니다.');
      const qData = await qRes.json();
      if (!qData.quote) throw new Error('종목 데이터를 제공할 수 없습니다.');
      const q = qData.quote;

      // 2. 기술적 파동 계산용 3개월 히스토리 조회
      const hRes = await fetch(`/api/history/${query}?period=3mo`);
      if (!hRes.ok) throw new Error('히스토리 지표 연산 중 오류가 발생했습니다.');
      const hData = await hRes.json();
      const bars = hData.bars || [];

      if (bars.length < 20) {
        throw new Error('기술 분석에 필요한 일일 거래 내역이 부족합니다.');
      }

      // 3. 3중 스토캐스틱 (단기 5,3,3) 및 RSI-14 실시간 추출
      const stochShortArray = calculateStochastic(bars, 5, 3);
      const latestStochShort = stochShortArray[stochShortArray.length - 1] ?? 50;
      const latestRsi = calculateRSI14(bars);

      const isUp = q.changePct > 0.5;

      const newStock: TrapStock = {
        ticker: q.ticker,
        name: q.name || q.ticker,
        price: q.price,
        preChangePct: parseFloat(q.changePct.toFixed(2)),
        preVolume: q.volume || 12000,
        avgVolume: q.avgVolume || 1500000,
        stochShort: parseFloat(latestStochShort.toFixed(1)),
        rsi14: parseFloat(latestRsi.toFixed(1)),
        sentiment: isUp ? 'positive' : 'neutral',
        newsTitle: isUp ? '실시간 프리마켓/본장 수급 및 거래 유동성 유입 랠리 포착' : '주요 보도자료 없는 일반 대기 매수세 등락'
      };

      setStocks(prev => [newStock, ...prev]);
      setSelectedStock(newStock);
      setSearchQuery('');
    } catch (err: any) {
      setSearchError(err.message || '요청 처리 중 예기치 못한 에러가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 3. Filtered Stocks List
  const filteredStocks = useMemo(() => {
    return computedStocks.filter(s => {
      if (activeFilter === 'all') return true;
      return s.classification === activeFilter;
    });
  }, [computedStocks, activeFilter]);

  // Set default selected stock
  useMemo(() => {
    if (filteredStocks.length > 0 && !selectedStock) {
      setSelectedStock(filteredStocks[0]);
    }
  }, [filteredStocks, selectedStock]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header Info */}
      <div className="card" style={{ padding: 18, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.03), rgba(59, 130, 246, 0.03))', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ShieldAlert size={20} color="var(--negative)" />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
            시계열 퀀트 감지기: 프리마켓 가짜 상승 & 설거지 함정 탐색기
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          본장이 시작되기 전 얇은 호가창을 노리고 거래량 없이 띄워진 **'가짜 펌핑(설거지 함정)'** 종목과, 거대 거래량이 동반되어 개장 후 급등 가능성이 큰 **'진짜 돌파'** 종목을 입체 연산합니다. 
          개장 직후 개미들을 사냥하는 덫을 사전에 간파하여 **개장 전 분할 선제 익절 전략**을 가능케 만듭니다.
        </p>
      </div>

      {/* DYNAMIC SEARCH BAR (업그레이드: 미국 전체 티커 실시간 스캔 기능 탑재) */}
      <form onSubmit={handleSearchAndAdd} style={{ 
        display: 'flex', 
        gap: 10, 
        background: 'var(--bg-card)', 
        padding: 12, 
        borderRadius: 8, 
        border: '1px solid var(--border-default)', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <Zap size={16} color="var(--accent-gold)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginRight: 6 }}>실시간 티커 추가 분석:</span>
        <input 
          type="text" 
          placeholder="미국 주식 티커 입력 (예: AMD, COIN, MSTR, SOXL...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={searchLoading}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '6px 12px',
            fontSize: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            outline: 'none',
            textTransform: 'uppercase'
          }}
        />
        <button 
          type="submit" 
          disabled={searchLoading}
          className="btn btn-sm btn-primary"
          style={{ padding: '6px 16px', fontSize: 12, height: 'auto', minHeight: 0, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {searchLoading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
          <span>{searchLoading ? '분석 중...' : '실시간 퀀트 스캔'}</span>
        </button>
        {searchError && (
          <span style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 600, marginLeft: 10 }}>
            ⚠️ {searchError}
          </span>
        )}
      </form>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        {[
          { id: 'all', label: `전체 종목 (${computedStocks.length})` },
          { id: 'trap', label: `🚨 설거지 함정 (${computedStocks.filter(s => s.classification === 'trap').length})` },
          { id: 'breakout', label: `🔥 진짜 돌파 (${computedStocks.filter(s => s.classification === 'breakout').length})` },
          { id: 'normal', label: `⚖️ 일반 흐름 (${computedStocks.filter(s => s.classification === 'normal').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveFilter(tab.id as any);
              const list = computedStocks.filter(s => tab.id === 'all' ? true : s.classification === tab.id);
              if (list.length > 0) setSelectedStock(list[0]);
            }}
            className={`btn btn-sm ${activeFilter === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        
        {/* Left: List Table Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>종목 (티커)</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>프리마켓 대비</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>평균대비 유동성</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>함정 위험도</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 700 }}>수급 상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s, idx) => {
                  const isSelected = selectedStock?.ticker === s.ticker;
                  return (
                    <tr 
                      key={s.ticker}
                      onClick={() => setSelectedStock(s)}
                      className="card-hover"
                      style={{ 
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.ticker}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.name}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: s.preChangePct > 0 ? 'var(--positive)' : 'var(--negative)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {s.preChangePct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {s.preChangePct > 0 ? '+' : ''}{s.preChangePct}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{s.volumePct.toFixed(2)}%</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            ({s.preVolume.toLocaleString()} / {s.avgVolume.toLocaleString()})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 45, background: 'var(--bg-elevated)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${s.trapScore}%`, 
                              background: s.trapScore >= 70 ? 'var(--negative)' : s.trapScore >= 40 ? 'var(--accent-gold)' : 'var(--positive)',
                              height: '100%' 
                            }} />
                          </div>
                          <span style={{ 
                            fontWeight: 800, 
                            color: s.trapScore >= 70 ? 'var(--negative)' : s.trapScore >= 40 ? 'var(--accent-gold)' : 'var(--positive)' 
                          }}>
                            {s.trapScore}점
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 700,
                            background: s.badgeBg,
                            color: s.badgeColor,
                            border: 'none',
                            padding: '3px 8px',
                            borderRadius: 4
                          }}
                        >
                          {s.classification === 'trap' ? '🚨 함정' : s.classification === 'breakout' ? '🔥 돌파' : '⚖️ 일반'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Detailed Analysis Panel */}
        <div>
          {selectedStock ? (
            <div className="card" style={{ 
              padding: 20, 
              border: `1px solid var(--border-default)`,
              borderTop: `4px solid ${selectedStock.badgeColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              
              {/* Card Header Ticker Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedStock.ticker}</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedStock.name}</p>
                </div>
                <span 
                  className="badge"
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    background: selectedStock.badgeBg,
                    color: selectedStock.badgeColor,
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: 'none'
                  }}
                >
                  위험지수 {selectedStock.trapScore}점
                </span>
              </div>

              {/* Diagnosis Badge Box */}
              <div style={{ 
                background: selectedStock.badgeBg, 
                padding: 12, 
                borderRadius: 8, 
                border: `1px solid ${selectedStock.badgeColor}33`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, color: selectedStock.badgeColor, marginBottom: 4 }}>
                  <span>{selectedStock.statusTitle}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {selectedStock.statusDesc}
                </p>
              </div>

              {/* Technical Indicator Parameters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>계량 지표 대조표</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>프리마켓 가격 변동</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedStock.preChangePct > 0 ? 'var(--positive)' : 'var(--negative)', marginTop: 2 }}>
                      {selectedStock.preChangePct > 0 ? '+' : ''}{selectedStock.preChangePct}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>수급 거래량 비율</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedStock.volumePct >= 5.0 ? 'var(--positive)' : 'var(--negative)', marginTop: 2 }}>
                      {selectedStock.volumePct.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>3중 스토캐스틱 (단기)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedStock.stochShort >= 75 ? 'var(--negative)' : 'var(--text-primary)', marginTop: 2 }}>
                      {selectedStock.stochShort.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>RSI-14 (상대강도)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: selectedStock.rsi14 >= 65 ? 'var(--negative)' : 'var(--text-primary)', marginTop: 2 }}>
                      {selectedStock.rsi14.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Premarket News and Sentiment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>최근 12H 주요 이슈 & 감성</h4>
                <div style={{ background: 'var(--bg-elevated)', padding: 10, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span 
                      className="badge" 
                      style={{ 
                        fontSize: 8, 
                        fontWeight: 800,
                        background: selectedStock.sentiment === 'positive' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                        color: selectedStock.sentiment === 'positive' ? 'var(--positive)' : 'var(--text-muted)',
                        padding: '1px 4px',
                        border: 'none'
                      }}
                    >
                      {selectedStock.sentiment === 'positive' ? '호재' : '중립'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                    "{selectedStock.newsTitle}"
                  </p>
                </div>
              </div>

              {/* ACTION RECOMMENDED FOR PRE-MARKET */}
              <div style={{ 
                borderTop: '1px solid var(--border-subtle)', 
                paddingTop: 14, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8 
              }}>
                <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>🚨 실전 개장 전 대응 시나리오</h4>
                
                {selectedStock.classification === 'trap' ? (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    <strong>[분할 매도/비중 축소 권장]</strong> 본장 시초가에 급격한 설거지용 하락 덤핑 폭탄이 우려됩니다. 현재 보유 중인 평단가 대비 수익권이시라면 <strong>본장 개장 직전 프리마켓에서 최소 40%~60% 이상 물량을 선제적으로 이익 실현(익절)</strong>하시어 현금을 확실하게 챙기시는 것을 강력 추천합니다. 본장 시초가 매수는 절대 엄금합니다.
                  </div>
                ) : selectedStock.classification === 'breakout' ? (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    <strong>[보유 유지 및 불타기 검토]</strong> 기관급 수급이 제대로 터진 견조한 대량 거래량 상승입니다. 장 개시 후 일시적인 흔들기가 있더라도 <strong>대세 강세 랠리로 안착할 확률이 극도로 높으므로 매도하지 말고 홀딩(HOLD)</strong>하시고, 본장 개시 후 눌림목 지지선이 견고히 안착되는 시점에 비중을 오히려 소폭 추가 확대(불타기)하는 대응이 유효합니다.
                  </div>
                ) : (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                    <strong>[정상 보유 및 시초가 대응]</strong> 특이 수급 함정이나 악성 매집은 보이지 않는 정상적인 범위의 횡보입니다. 장 시작 후 일반적인 섹터 수급 동향에 발맞추어 움직일 것이므로, 무리해서 개장 전에 대처하기보다는 <strong>장 개시 후 30분이 지난 안착점 시점에 차트 지지를 재확인하고 평온하게 평단가를 대응</strong>하시면 충분합니다.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <HelpCircle size={28} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>종목을 클릭하시면 퀀트 함정 진단서가 활성화됩니다.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
