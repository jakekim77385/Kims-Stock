'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Edit3, Check, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
const ValuationChart    = dynamic(() => import('./ValuationChart'),    { ssr: false });
const RecoveryAnalysis  = dynamic(() => import('./RecoveryAnalysis'),  { ssr: false });
const DeclineAnalysis   = dynamic(() => import('./DeclineAnalysis'),   { ssr: false });
const MoneyFlow         = dynamic(() => import('./MoneyFlow'),         { ssr: false });
const MacroAnalysis     = dynamic(() => import('./MacroAnalysis'),     { ssr: false });
const SectorWeather     = dynamic(() => import('./SectorWeather'),     { ssr: false });

// ─── 섹션 정의 ────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'outlook',   label: '시장 전망',   placeholder: '현재 시장의 전반적인 방향성과 전망을 작성하세요.' },
  { id: 'issue',     label: '주요 이슈',   placeholder: '주목해야 할 매크로 이슈, 리스크 요인을 작성하세요.' },
  { id: 'strategy',  label: '투자 전략',   placeholder: '현시점 포지셔닝 전략과 섹터/종목 선택 기준을 작성하세요.' },
  { id: 'watchlist', label: '주목 종목',   placeholder: '현재 관심 종목과 그 이유를 작성하세요.' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

interface DhNote {
  date:      string;
  outlook:   string;
  issue:     string;
  strategy:  string;
  watchlist: string;
}

const STORAGE_KEY = 'dh-analysis-notes';

function loadNote(): DhNote {
  if (typeof window === 'undefined') return emptyNote();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DhNote;
  } catch { /* ignore */ }
  return emptyNote();
}

function emptyNote(): DhNote {
  return {
    date:      new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
    outlook:   '',
    issue:     '',
    strategy:  '',
    watchlist: '',
  };
}

// ─── 개별 편집 섹션 ─────────────────────────────────────────────────────────
function EditableSection({
  label, value, placeholder, onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const len = ref.current.value.length;
      ref.current.setSelectionRange(len, len);
    }
  }, [editing]);

  // 자동 높이 조정
  const autoResize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* 라벨 + 편집 토글 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#1a56db',
        }}>
          {label}
        </span>
        <button
          onClick={() => setEditing((e) => !e)}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 10, color: editing ? '#16803c' : '#999',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', padding: '1px 4px',
            borderRadius: 3,
            transition: 'color 0.1s',
          }}
        >
          {editing ? <Check size={11} /> : <Edit3 size={11} />}
          {editing ? '완료' : '편집'}
        </button>
      </div>

      {/* 내용 영역 */}
      {editing ? (
        <textarea
          ref={ref}
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); autoResize(); }}
          onBlur={() => setEditing(false)}
          style={{
            width: '100%',
            minHeight: 80,
            background: '#fafafa',
            border: '1px solid #1a56db',
            borderRadius: 4,
            padding: '8px 10px',
            fontSize: 13,
            lineHeight: 1.7,
            color: '#111',
            fontFamily: 'Inter, sans-serif',
            resize: 'none',
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(26,86,219,0.08)',
            overflow: 'hidden',
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            minHeight: 48,
            padding: '8px 10px',
            background: value ? 'transparent' : '#fafafa',
            border: `1px solid ${value ? 'var(--border-subtle)' : '#e8e8e8'}`,
            borderRadius: 4,
            fontSize: 13,
            lineHeight: 1.7,
            color: value ? '#111' : '#bbb',
            cursor: 'text',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transition: 'border-color 0.1s, background 0.1s',
          }}
          onMouseEnter={(e) => { if (!value) e.currentTarget.style.borderColor = '#bbb'; }}
          onMouseLeave={(e) => { if (!value) e.currentTarget.style.borderColor = '#e8e8e8'; }}
        >
          {value || placeholder}
        </div>
      )}
    </div>
  );
}

type TabId = 'note' | 'macro' | 'weather' | 'valuation' | 'recovery' | 'decline' | 'moneyflow';

// ─── DH 분석 패널 ────────────────────────────────────────────────────────────
export default function DhAnalysis() {
  const [activeTab, setActiveTab] = useState<TabId>('note');
  const [note, setNote]       = useState<DhNote>(emptyNote);
  const [saved, setSaved]     = useState(false);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후 localStorage 로드
  useEffect(() => {
    setNote(loadNote());
    setMounted(true);
  }, []);

  // 변경 시 자동 저장
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(note));
    setSaved(true);
    const t = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(t);
  }, [note, mounted]);

  const updateField = (field: SectionId, value: string) =>
    setNote((prev) => ({ ...prev, [field]: value }));

  const resetNote = () => {
    if (!confirm('모든 내용을 초기화할까요?')) return;
    const fresh = emptyNote();
    setNote(fresh);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e8e8e8',
      borderRadius: 7,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 3, height: 18, borderRadius: 2,
            background: 'linear-gradient(180deg, #1a56db, #0891b2)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>DH 분석</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{note.date}</div>
          </div>
          {/* 탭 */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 12 }}>
            {([['note', '📝 메모'], ['macro', '🌐 거시 판도'], ['weather', '🌤️ 섹터별 일기예보'], ['valuation', '📊 저평가'], ['recovery', '📈 반등'], ['decline', '📉 하락'], ['moneyflow', '🌊 자금흐름']] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px',
                  borderRadius: 5, cursor: 'pointer', border: '1px solid',
                  fontFamily: 'inherit',
                  borderColor:  activeTab === id ? '#1a56db' : '#e0e0e0',
                  background:   activeTab === id ? '#eef2ff' : 'white',
                  color:        activeTab === id ? '#1a56db' : '#888',
                }}
              >{lbl}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saved && (
            <span style={{ fontSize: 10, color: '#16803c', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Check size={10} /> 저장됨
            </span>
          )}
          <button
            onClick={() => setNote((prev) => ({
              ...prev,
              date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }),
            }))}
            title="날짜 갱신"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 10, color: '#999',
              background: 'none', border: '1px solid #e8e8e8',
              borderRadius: 4, cursor: 'pointer', padding: '3px 8px',
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={10} /> 날짜 갱신
          </button>
          <button
            onClick={resetNote}
            style={{
              fontSize: 10, color: '#999',
              background: 'none', border: '1px solid #e8e8e8',
              borderRadius: 4, cursor: 'pointer', padding: '3px 8px',
              fontFamily: 'inherit',
            }}
          >
            초기화
          </button>
        </div>
      </div>

      {/* 탭 본문 */}
      {activeTab === 'note' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {SECTIONS.map((sec, i) => (
            <div key={sec.id} style={{
              padding: '16px 20px',
              borderRight:  i % 2 === 0 ? '1px solid #f0f0f0' : undefined,
              borderBottom: i < 2       ? '1px solid #f0f0f0' : undefined,
            }}>
              <EditableSection
                label={sec.label}
                value={note[sec.id]}
                placeholder={sec.placeholder}
                onChange={(v) => updateField(sec.id, v)}
              />
            </div>
          ))}
        </div>
      ) : activeTab === 'macro' ? (
        <MacroAnalysis />
      ) : activeTab === 'weather' ? (
        <SectorWeather />
      ) : activeTab === 'valuation' ? (
        <ValuationChart />
      ) : activeTab === 'recovery' ? (
        <RecoveryAnalysis />
      ) : activeTab === 'decline' ? (
        <DeclineAnalysis />
      ) : (
        <MoneyFlow />
      )}
    </div>
  );
}
