'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, BadgeCheck, FileText, Flag, Gavel, ShoppingBag, XCircle, CreditCard, RefreshCw, CheckCheck } from 'lucide-react';
import './admin-bell.css';

type Kind = 'LISTING' | 'REPORT' | 'DISPUTE' | 'VERIFY' | 'ORDER' | 'CANCEL' | 'PAYMENT';
type Item = { id: string; kind: Kind; from: 'BUYER' | 'SELLER' | 'SYSTEM'; title: string; detail: string; createdAt: string; nav: string };
type Payload = { counts: Record<string, number>; actionable: number; items: Item[] };

const META: Record<Kind, { icon: typeof Bell; tone: string }> = {
  LISTING: { icon: FileText, tone: 'amber' }, REPORT: { icon: Flag, tone: 'red' }, DISPUTE: { icon: Gavel, tone: 'red' },
  VERIFY: { icon: BadgeCheck, tone: 'blue' }, ORDER: { icon: ShoppingBag, tone: 'green' }, CANCEL: { icon: XCircle, tone: 'gray' }, PAYMENT: { icon: CreditCard, tone: 'red' },
};
const FROM = { BUYER: 'Người mua', SELLER: 'Người bán', SYSTEM: 'Hệ thống' } as const;
const TABS: { key: 'ALL' | 'BUYER' | 'SELLER' | 'SYSTEM'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'BUYER', label: 'Người mua' }, { key: 'SELLER', label: 'Người bán' }, { key: 'SYSTEM', label: 'Hệ thống' },
];
const SEEN_KEY = 'tt-admin-bell-seen';

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return `${Math.floor(s / 86400)} ngày trước`;
}
function readSeen(): string[] { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } }

export function AdminBell({ getHeaders, onNavigate }: { getHeaders: () => Record<string, string>; onNavigate: (nav: string) => void }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [tab, setTab] = useState<'ALL' | 'BUYER' | 'SELLER' | 'SYSTEM'>('ALL');
  const [seen, setSeen] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ring, setRing] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const known = useRef<Set<string> | null>(null);
  const headersRef = useRef(getHeaders);
  headersRef.current = getHeaders;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/alerts', { headers: headersRef.current() }).then((r) => r.json());
      if (res?.success && res.data) {
        const next = res.data as Payload;
        if (known.current) {
          const fresh = next.items.filter((i) => !known.current!.has(i.id));
          if (fresh.length) { setRing(true); window.setTimeout(() => setRing(false), 2500); }
        }
        known.current = new Set(next.items.map((i) => i.id));
        setData(next);
      }
    } catch { /* giữ dữ liệu cũ */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { setSeen(readSeen()); load(); const t = window.setInterval(load, 30000); return () => window.clearInterval(t); }, [load]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  const unseen = useMemo(() => (data?.items ?? []).filter((i) => !seen.includes(i.id)), [data, seen]);
  const badge = Math.max(unseen.length, 0);
  const shown = (data?.items ?? []).filter((i) => tab === 'ALL' || i.from === tab);
  const tabCount = (k: string) => (data?.items ?? []).filter((i) => k === 'ALL' || i.from === k).filter((i) => !seen.includes(i.id)).length;

  function markSeen(ids: string[]) {
    const next = Array.from(new Set([...seen, ...ids])).slice(-300);
    setSeen(next); try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  }

  return (
    <div className="ab-wrap" ref={box}>
      <button type="button" className={`ab-btn${ring ? ' ring' : ''}`} onClick={() => { setOpen(!open); if (!open) load(); }} title="Thông báo quản trị" aria-label="Thông báo quản trị">
        <Bell size={18} />
        {badge > 0 && <span className="ab-badge">{badge > 99 ? '99+' : badge}</span>}
      </button>
      {open && (
        <div className="ab-pop" role="dialog" aria-label="Thông báo quản trị">
          <div className="ab-head">
            <div><strong>Thông báo quản trị</strong><small>{data ? `${data.actionable} việc cần xử lý` : 'Đang tải…'}</small></div>
            <div className="ab-head-actions">
              <button type="button" onClick={load} title="Làm mới" className={loading ? 'spin' : ''}><RefreshCw size={15} /></button>
              <button type="button" onClick={() => markSeen((data?.items ?? []).map((i) => i.id))} title="Đánh dấu đã xem tất cả"><CheckCheck size={16} /></button>
            </div>
          </div>
          <div className="ab-tabs">
            {TABS.map((t) => (
              <button key={t.key} type="button" className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
                {t.label}{tabCount(t.key) > 0 && <b>{tabCount(t.key)}</b>}
              </button>
            ))}
          </div>
          <div className="ab-list">
            {!data && <p className="ab-empty">Đang tải thông báo…</p>}
            {data && shown.length === 0 && <p className="ab-empty">Không có thông báo nào ở mục này.</p>}
            {shown.map((i) => {
              const M = META[i.kind]; const Icon = M.icon; const isNew = !seen.includes(i.id);
              return (
                <button type="button" key={i.id} className={`ab-item${isNew ? ' new' : ''}`} onClick={() => { markSeen([i.id]); setOpen(false); onNavigate(i.nav); }}>
                  <span className={`ab-ico ${M.tone}`}><Icon size={17} /></span>
                  <span className="ab-body">
                    <span className="ab-title">{i.title}<em className={`ab-from ${i.from.toLowerCase()}`}>{FROM[i.from]}</em></span>
                    <span className="ab-detail">{i.detail}</span>
                    <span className="ab-time">{ago(i.createdAt)}</span>
                  </span>
                  {isNew && <i className="ab-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
