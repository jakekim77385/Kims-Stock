'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { macroEvents, MacroEvent } from '@/lib/mockData';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  ExternalLink,
  Info,
  Clock,
  X,
  ArrowRight
} from 'lucide-react';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMonth, setSelectedMonth] = useState<'2026-05' | '2026-06' | '2026-07'>('2026-05');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'fed' | 'earnings' | 'indicator' | 'market'>('all');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<MacroEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: number; events: MacroEvent[] } | null>(null);

  // Filter events based on selections
  const filteredEvents = useMemo(() => {
    return macroEvents.filter(ev => {
      // Category match
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      
      // Importance match
      if (importanceFilter !== 'all' && ev.importance !== importanceFilter) return false;
      
      // Search query match
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesEvent = ev.event.toLowerCase().includes(query);
        const matchesDesc = ev.description?.toLowerCase().includes(query) ?? false;
        const matchesTicker = ev.ticker?.toLowerCase().includes(query) ?? false;
        if (!matchesEvent && !matchesDesc && !matchesTicker) return false;
      }
      
      return true;
    });
  }, [categoryFilter, importanceFilter, searchQuery]);

  // Specific events for grid rendering
  const gridEvents = useMemo(() => {
    return macroEvents.filter(ev => ev.date.startsWith(selectedMonth));
  }, [selectedMonth]);

  // Generate calendar grid dates
  const calendarGrid = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed for JS Date

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const numDays = new Date(year, month + 1, 0).getDate(); // Number of days in month

    const days = [];
    
    // Empty blocks for padding before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateString: '' });
    }
    
    // Actual days of the month
    for (let d = 1; d <= numDays; d++) {
      const dateString = `${yearStr}-${monthStr}-${d.toString().padStart(2, '0')}`;
      days.push({ day: d, dateString });
    }

    return days;
  }, [selectedMonth]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === '2026-06') setSelectedMonth('2026-05');
      else if (selectedMonth === '2026-07') setSelectedMonth('2026-06');
    } else {
      if (selectedMonth === '2026-05') setSelectedMonth('2026-06');
      else if (selectedMonth === '2026-06') setSelectedMonth('2026-07');
    }
  };

  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return <span className="badge badge-red" style={{ fontSize: 10 }}><AlertTriangle size={9} /> 상 (High)</span>;
      case 'medium':
        return <span className="badge badge-gold" style={{ fontSize: 10 }}>중 (Medium)</span>;
      case 'low':
      default:
        return <span className="badge badge-neutral" style={{ fontSize: 10 }}>하 (Low)</span>;
    }
  };

  const getCategoryName = (cat?: string) => {
    switch (cat) {
      case 'fed': return '연준 일정';
      case 'earnings': return '기업 실적';
      case 'indicator': return '경제 지표';
      case 'market': return '증시 일정';
      default: return '기타 일정';
    }
  };

  const getCategoryBadgeColor = (cat?: string) => {
    switch (cat) {
      case 'fed': return 'rgba(139, 92, 246, 0.12)'; // purple
      case 'earnings': return 'rgba(59, 130, 246, 0.12)'; // blue
      case 'indicator': return 'rgba(16, 185, 129, 0.12)'; // green
      case 'market': return 'rgba(245, 158, 11, 0.12)'; // orange
      default: return 'var(--bg-elevated)';
    }
  };

  const getCategoryTextColor = (cat?: string) => {
    switch (cat) {
      case 'fed': return '#8b5cf6';
      case 'earnings': return '#3b82f6';
      case 'indicator': return '#10b981';
      case 'market': return '#f59e0b';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>미국 증시 & 거시경제 캘린더</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            미국 연준(Fed) 주요 스탠스, 3대 물가지표(CPI·PPI·PCE), 신규 실적 발표 등 핵심 일정을 한눈에 모니터링합니다.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 3, borderRadius: 8, border: '1px solid var(--border-default)' }}>
          <button 
            onClick={() => setViewMode('grid')}
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', height: 'auto', minHeight: 0, borderRadius: 6 }}
          >
            <CalendarIcon size={13} />
            <span>달력 그리드</span>
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', height: 'auto', minHeight: 0, borderRadius: 6 }}
          >
            <List size={13} />
            <span>타임라인 목록</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, flexWrap: 'wrap' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="일정 이름, 관련 종목(티커 e.g. NVDA), 키워드 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                fontSize: 13,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <X 
                size={14} 
                color="var(--text-muted)" 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} 
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Importance Filter */}
            <select 
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">중요도: 전체</option>
              <option value="high">중요도: 상 (High)</option>
              <option value="medium">중요도: 중 (Medium)</option>
              <option value="low">중요도: 하 (Low)</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          {[
            { id: 'all', label: '전체 일정' },
            { id: 'fed', label: '연준 & 금리' },
            { id: 'indicator', label: '경제 지표' },
            { id: 'earnings', label: '기업 실적 발표' },
            { id: 'market', label: '주요 증시 일정' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id as any)}
              className={`badge ${categoryFilter === tab.id ? 'badge-blue' : 'badge-neutral'}`}
              style={{ 
                cursor: 'pointer', 
                border: 'none', 
                padding: '7px 14px', 
                fontSize: 12, 
                fontWeight: 600,
                borderRadius: 20
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? '1fr 340px' : '1fr', gap: 20, alignItems: 'start' }}>
        
        {/* VIEW 1: Calendar Grid Mode */}
        {viewMode === 'grid' && (
          <div className="card" style={{ padding: '16px 20px 24px 20px' }}>
            {/* Calendar Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarIcon size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: 16, fontWeight: 800 }}>
                  {selectedMonth.split('-')[0]}년 {parseInt(selectedMonth.split('-')[1])}월
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => handleMonthChange('prev')}
                  disabled={selectedMonth === '2026-05'}
                  className="btn btn-sm btn-ghost"
                  style={{ width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedMonth === '2026-05' ? 0.3 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setSelectedMonth('2026-05')}
                  className={`btn btn-sm ${selectedMonth === '2026-05' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ padding: '0 8px', fontSize: 11, height: 30 }}
                >
                  5월
                </button>
                <button 
                  onClick={() => setSelectedMonth('2026-06')}
                  className={`btn btn-sm ${selectedMonth === '2026-06' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ padding: '0 8px', fontSize: 11, height: 30 }}
                >
                  6월
                </button>
                <button 
                  onClick={() => setSelectedMonth('2026-07')}
                  className={`btn btn-sm ${selectedMonth === '2026-07' ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{ padding: '0 8px', fontSize: 11, height: 30 }}
                >
                  7월
                </button>
                <button 
                  onClick={() => handleMonthChange('next')}
                  disabled={selectedMonth === '2026-07'}
                  className="btn btn-sm btn-ghost"
                  style={{ width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedMonth === '2026-07' ? 0.3 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Calendar Grid Sheet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {/* Day Headers */}
              {['일', '월', '화', '수', '목', '금', '토'].map((h, i) => (
                <div key={h} style={{ 
                  textAlign: 'center', 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: i === 0 ? 'var(--negative)' : i === 6 ? 'var(--accent-blue)' : 'var(--text-muted)',
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  {h}
                </div>
              ))}

              {/* Grid Days */}
              {calendarGrid.map((gridItem, idx) => {
                const isPlaceholder = gridItem.day === null;
                const hasEvents = gridItem.dateString ? macroEvents.some(e => e.date === gridItem.dateString) : false;
                
                // Events for this exact day
                const dayEvents = gridItem.dateString 
                  ? macroEvents.filter(e => e.date === gridItem.dateString)
                  : [];

                // Filtered events for this exact day
                const dayFilteredEvents = gridItem.dateString
                  ? filteredEvents.filter(e => e.date === gridItem.dateString)
                  : [];

                const isSelectedDay = selectedDayEvents?.day === gridItem.day;

                return (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (!isPlaceholder && gridItem.day !== null) {
                        setSelectedDayEvents({ day: gridItem.day, events: dayEvents });
                        if (dayEvents.length > 0) {
                          setSelectedEvent(dayEvents[0]); // Set first event as active in detail
                        }
                      }
                    }}
                    style={{
                      height: 85,
                      background: isPlaceholder 
                        ? 'transparent' 
                        : isSelectedDay 
                          ? 'rgba(59, 130, 246, 0.08)' 
                          : 'var(--bg-elevated)',
                      border: isPlaceholder 
                        ? 'none' 
                        : isSelectedDay
                          ? '1px solid var(--accent-blue)'
                          : '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: isPlaceholder ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isPlaceholder ? 0.3 : 1,
                    }}
                    className={!isPlaceholder ? 'card-hover' : ''}
                  >
                    {!isPlaceholder && (
                      <>
                        {/* Day Number */}
                        <div style={{ 
                          fontSize: 12, 
                          fontWeight: 700,
                          color: isSelectedDay ? 'var(--accent-blue)' : 'var(--text-primary)'
                        }}>
                          {gridItem.day}
                        </div>

                        {/* Event list summarized */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                          {dayFilteredEvents.slice(0, 2).map((ev, i) => (
                            <div 
                              key={i} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(ev);
                                setShowModal(true);
                              }}
                              style={{ 
                                fontSize: 9, 
                                fontWeight: 600,
                                background: getCategoryBadgeColor(ev.category),
                                color: getCategoryTextColor(ev.category),
                                padding: '2px 4px', 
                                borderRadius: 3, 
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                cursor: 'pointer',
                                transition: 'filter 0.1s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.92)'}
                              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                            >
                              {ev.importance === 'high' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--negative)' }} />}
                              {ev.ticker || ev.event.substring(0, 8)}
                            </div>
                          ))}
                          {dayFilteredEvents.length > 2 && (
                            <div style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>
                              + {dayFilteredEvents.length - 2}개 더보기
                            </div>
                          )}
                        </div>

                        {/* Dots of Importance */}
                        <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
                          {dayEvents.map((ev, i) => (
                            <span 
                              key={i} 
                              style={{ 
                                width: 4, 
                                height: 4, 
                                borderRadius: '50%', 
                                background: ev.importance === 'high' 
                                  ? 'var(--negative)' 
                                  : ev.importance === 'medium' 
                                    ? 'var(--accent-gold)' 
                                    : 'var(--text-muted)' 
                              }} 
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timezone advisory */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <Clock size={11} />
              <span>미국 동부 시간(EST/EDT) 기준 일정이며, 국내 시간 기준 날짜로 보정하여 노출하고 있습니다.</span>
            </div>
          </div>
        )}

        {/* VIEW 2: Timeline List Mode */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredEvents.length === 0 ? (
              <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Info size={28} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>필터에 일치하는 일정이 존재하지 않습니다.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>검색어 또는 필터 기준을 조정해 보세요.</p>
              </div>
            ) : (
              filteredEvents.map((ev, i) => {
                const dateObj = new Date(ev.date);
                const isPast = dateObj < new Date('2026-05-24'); // local mock date is 24th
                
                return (
                  <div 
                    key={i} 
                    className="card card-hover" 
                    onClick={() => {
                      setSelectedEvent(ev);
                      setShowModal(true);
                    }}
                    style={{ 
                      padding: 16, 
                      cursor: 'pointer',
                      borderLeft: `4px solid ${ev.importance === 'high' ? 'var(--negative)' : ev.importance === 'medium' ? 'var(--accent-gold)' : 'var(--border-default)'}`,
                      background: selectedEvent?.event === ev.event ? 'rgba(59, 130, 246, 0.04)' : 'var(--bg-card)',
                      borderColor: selectedEvent?.event === ev.event ? 'var(--accent-blue)' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      
                      {/* Left: Date Indicator */}
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ 
                          width: 46, 
                          height: 46, 
                          borderRadius: 8, 
                          background: 'var(--bg-elevated)', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {dateObj.toLocaleDateString('ko-KR', { month: 'short' })}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                            {dateObj.getDate()}
                          </span>
                        </div>

                        {/* Title & Badge Details */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            {getImportanceBadge(ev.importance)}
                            <span 
                              style={{ 
                                fontSize: 10, 
                                fontWeight: 700, 
                                padding: '2px 6px', 
                                borderRadius: 4,
                                background: getCategoryBadgeColor(ev.category),
                                color: getCategoryTextColor(ev.category)
                              }}
                            >
                              {getCategoryName(ev.category)}
                            </span>
                            {ev.ticker && (
                              <span className="badge badge-blue" style={{ fontSize: 10 }}>{ev.ticker}</span>
                            )}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {ev.event}
                          </div>
                        </div>
                      </div>

                      {/* Right: Numbers Summary */}
                      <div style={{ display: 'flex', gap: 14, textAlign: 'right', fontSize: 11 }}>
                        {ev.forecast !== '-' && (
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>예상치</div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev.forecast}</div>
                          </div>
                        )}
                        {ev.previous !== '-' && (
                          <div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>이전치</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{ev.previous}</div>
                          </div>
                        )}
                        {ev.actual && (
                          <div>
                            <div style={{ color: 'var(--accent-blue)', fontSize: 10, fontWeight: 700 }}>실제값</div>
                            <div style={{ 
                              fontWeight: 800, 
                              color: ev.actual.includes('서프라이즈') || ev.actual.includes('완화적') ? 'var(--positive)' : 'var(--negative)' 
                            }}>{ev.actual}</div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SIDE BAR / DETAIL PANEL */}
        {/* VIEW 1 Side Panel (Visible when grid is active) */}
        {viewMode === 'grid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Selected Day Event summary list */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  {selectedMonth.split('-')[1]}월 {selectedDayEvents?.day || '20'}일 주요 일정
                </span>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                  일정 {selectedDayEvents?.events.length ?? 0}개
                </span>
              </div>

              {(!selectedDayEvents || selectedDayEvents.events.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  <Info size={20} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: 11, fontWeight: 600 }}>선택한 날짜에 예정된 일정이 없습니다.</p>
                  <p style={{ fontSize: 9, marginTop: 2 }}>달력의 숫자를 클릭해 보세요.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedDayEvents.events.map((ev, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        setSelectedEvent(ev);
                        setShowModal(true);
                      }}
                      style={{ 
                        padding: 10, 
                        borderRadius: 6, 
                        background: selectedEvent?.event === ev.event ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-elevated)',
                        border: selectedEvent?.event === ev.event ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span 
                          style={{ 
                            fontSize: 9, 
                            fontWeight: 700, 
                            padding: '1px 5px', 
                            borderRadius: 3,
                            background: getCategoryBadgeColor(ev.category),
                            color: getCategoryTextColor(ev.category)
                          }}
                        >
                          {getCategoryName(ev.category)}
                        </span>
                        <span style={{ fontSize: 8 }}>
                          {ev.importance === 'high' ? '🔴 상' : ev.importance === 'medium' ? '🟡 중' : '⚪ 하'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {ev.event}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Selected Event Insight Panel */}
            {selectedEvent && (
              <div className="card" style={{ 
                padding: 18, 
                border: '1px solid var(--border-default)', 
                borderTop: `4px solid ${selectedEvent.importance === 'high' ? 'var(--negative)' : selectedEvent.importance === 'medium' ? 'var(--accent-gold)' : 'var(--border-default)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '2px 6px', 
                        borderRadius: 4,
                        background: getCategoryBadgeColor(selectedEvent.category),
                        color: getCategoryTextColor(selectedEvent.category),
                        marginRight: 6
                      }}
                    >
                      {getCategoryName(selectedEvent.category)}
                    </span>
                    {selectedEvent.ticker && (
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>{selectedEvent.ticker}</span>
                    )}
                  </div>
                  {getImportanceBadge(selectedEvent.importance)}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {selectedEvent.event}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <Clock size={11} />
                  <span>{new Date(selectedEvent.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                {/* Economic numbers */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 8, 
                  background: 'var(--bg-elevated)', 
                  padding: 10, 
                  borderRadius: 6,
                  margin: '12px 0',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>이전치</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedEvent.previous}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>예상치</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedEvent.forecast}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--accent-blue)', fontWeight: 700 }}>실제치</div>
                    <div style={{ 
                      fontSize: 12, 
                      fontWeight: 800, 
                      color: selectedEvent.actual 
                        ? (selectedEvent.actual.includes('서프라이즈') || selectedEvent.actual.includes('완화적') ? 'var(--positive)' : 'var(--negative)') 
                        : 'var(--text-muted)' 
                    }}>
                      {selectedEvent.actual || '발표대기'}
                    </div>
                  </div>
                </div>

                {/* Brief Commentary */}
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 10 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>일정 설명</div>
                  {selectedEvent.description || '이 일정에 대한 상세 해설이 아직 등록되지 않았습니다.'}
                </div>

                {selectedEvent.impactCommentary && (
                  <div style={{ 
                    fontSize: 12, 
                    color: 'var(--text-primary)', 
                    lineHeight: 1.5, 
                    marginTop: 12, 
                    background: 'rgba(59, 130, 246, 0.05)', 
                    padding: 10, 
                    borderRadius: 6,
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>시장 예상 영향</div>
                    {selectedEvent.impactCommentary}
                  </div>
                )}

                {/* Corporate Stock Link Shortcut */}
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: 10,
                    fontSize: 12,
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderRadius: 6
                  }}
                >
                  <Info size={13} />
                  <span>백과사전식 설명 및 상세 팝업 보기</span>
                </button>

                {selectedEvent.category === 'earnings' && selectedEvent.ticker && (
                  <Link 
                    href={`/analysis?ticker=${selectedEvent.ticker}`}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      marginTop: 14, 
                      fontSize: 12, 
                      padding: '9px 12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 6,
                      borderRadius: 6 
                    }}
                  >
                    <span>{selectedEvent.ticker} 세부 분석 및 재무 정보</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DETAILED DRAWER: Visible when an event is clicked for pop-up explanation */}
      {showModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 20
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: 500,
            padding: 24,
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-default)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    background: getCategoryBadgeColor(selectedEvent.category),
                    color: getCategoryTextColor(selectedEvent.category),
                    marginRight: 6
                  }}
                >
                  {getCategoryName(selectedEvent.category)}
                </span>
                {selectedEvent.ticker && (
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>{selectedEvent.ticker}</span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {getImportanceBadge(selectedEvent.importance)}
                <X 
                  size={18} 
                  color="var(--text-muted)" 
                  onClick={() => setShowModal(false)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 6 }}>
              {selectedEvent.event}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              <Clock size={12} />
              <span>{new Date(selectedEvent.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
            </div>

            {/* Economic indicators grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 12, 
              background: 'var(--bg-elevated)', 
              padding: 14, 
              borderRadius: 8,
              margin: '16px 0',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>이전 발표치</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedEvent.previous}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>시장 예상치</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedEvent.forecast}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--accent-blue)', fontWeight: 700 }}>실제 결과값</div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 800, 
                  color: selectedEvent.actual 
                    ? (selectedEvent.actual.includes('서프라이즈') || selectedEvent.actual.includes('완화적') ? 'var(--positive)' : 'var(--negative)') 
                    : 'var(--text-muted)',
                  marginTop: 2
                }}>
                  {selectedEvent.actual || '발표 대기'}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>일정 개요</div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {selectedEvent.description || '이 일정에 대한 상세 해설이 존재하지 않습니다.'}
              </p>
            </div>

            {/* Market Commentary */}
            {selectedEvent.impactCommentary && (
              <div style={{ 
                marginTop: 18, 
                background: 'rgba(59, 130, 246, 0.05)', 
                padding: 12, 
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{ fontWeight: 800, color: 'var(--accent-blue)', fontSize: 11, textTransform: 'uppercase', marginBottom: 6 }}>투자 포인트 & 시장 영향</div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {selectedEvent.impactCommentary}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button 
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: 13, height: 38 }}
              >
                닫기
              </button>
              {selectedEvent.category === 'earnings' && selectedEvent.ticker && (
                <Link 
                  href={`/analysis?ticker=${selectedEvent.ticker}`}
                  className="btn btn-primary"
                  style={{ 
                    flex: 2, 
                    fontSize: 13, 
                    height: 38,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 6,
                    borderRadius: 6 
                  }}
                >
                  <span>{selectedEvent.ticker} 상세 스크리너/분석</span>
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
