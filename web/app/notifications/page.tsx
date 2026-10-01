'use client';
import './notifications.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, CheckCheck, ChevronRight, Inbox, LayoutGrid, MessageCircle, Receipt, FileText, ShieldCheck, RefreshCw } from 'lucide-react';
import { MemberArea } from '../../components/MemberArea';
import { noticeIcon } from '../../components/NoticeIcon';
import { memberRequest } from '../../lib/api';
import { GROUPS, GROUP_STYLE, groupOf, noticeLink, timeAgo, type Notice, type NoticeGroup } from '../../lib/notifications';

const PAGE = 30;
const TAB_ICON: Record<NoticeGroup, typeof Bell> = { all: LayoutGrid, listing: FileText, transaction: Receipt, messages: MessageCircle, system: ShieldCheck };

export default function NotificationsPage() { return <MemberArea>{() => <List />}</MemberArea>; }

function dayKey(v: string) { const d = new Date(v); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
function dayLabel(v: string) {
  const now = new Date(); const d = new Date(v);
  if (dayKey(v) === dayKey(now.toISOString())) return 'Hôm nay';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (dayKey(v) === dayKey(y.toISOString())) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function List() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [group, setGroup] = useState<NoticeGroup>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (offset: number) => {
    setLoading(true); setError('');
    try {
      const rows = await memberRequest<Notice[]>(`/notifications?limit=${PAGE}&offset=${offset}${onlyUnread ? '&unread=1' : ''}`);
      setItems(prev => (offset ? [...prev, ...rows] : rows)); setMore(rows.length === PAGE);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được thông báo.'); } finally { setLoading(false); }
  }, [onlyUnread]);
  useEffect(() => { void load(0); }, [load]);

  function markLocal(id: string) { setItems(l => l.map(x => (x.id === id ? { ...x, is_read: true } : x))); }
  async function open(n: Notice) {
    if (!n.is_read) { markLocal(n.id); void memberRequest(`/notifications/${n.id}/read`, 'PATCH', {}).catch(() => undefined); }
    const link = noticeLink(n); if (link) router.push(link);
  }
  async function readOne(e: React.MouseEvent, n: Notice) {
    e.stopPropagation(); markLocal(n.id); void memberRequest(`/notifications/${n.id}/read`, 'PATCH', {}).catch(() => undefined);
  }
  async function readAll() { try { await memberRequest('/notifications/read-all', 'PATCH', {}); setItems(l => l.map(x => ({ ...x, is_read: true }))); } catch (e) { setError(e instanceof Error ? e.message : 'Không thực hiện được.'); } }

  const unread = items.filter(n => !n.is_read).length;
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, listing: 0, transaction: 0, messages: 0, system: 0 };
    for (const n of items) c[groupOf(n.type)]++;
    return c;
  }, [items]);
  const shown = items.filter(n => group === 'all' || groupOf(n.type) === group);
  const sections = useMemo(() => {
    const out: { key: string; label: string; rows: Notice[] }[] = [];
    for (const n of shown) {
      const k = dayKey(n.created_at); const last = out[out.length - 1];
      if (last && last.key === k) last.rows.push(n); else out.push({ key: k, label: dayLabel(n.created_at), rows: [n] });
    }
    return out;
  }, [shown]);

  return <div className="nt-page">
    <header className="nt-hero">
      <div className="nt-hero-ico"><Bell size={30} /></div>
      <div className="nt-hero-txt">
        <h1>Thông báo</h1>
        <p>Cập nhật về tin đăng, giao dịch, tin nhắn và thông báo từ Tất Tần Tật.</p>
      </div>
      <div className="nt-stats">
        <div><b>{unread}</b><span>Chưa đọc</span></div>
        <div><b>{items.length}</b><span>Đã tải</span></div>
      </div>
    </header>

    <div className="nt-bar">
      <div className="nt-tabs" role="tablist">
        {GROUPS.map(g => { const Icon = TAB_ICON[g.key]; return <button key={g.key} role="tab" aria-selected={group === g.key} className={'nt-tab' + (group === g.key ? ' on' : '')} onClick={() => setGroup(g.key)}>
          <Icon size={16} />{g.label}{counts[g.key] > 0 && <em>{counts[g.key]}</em>}
        </button>; })}
      </div>
      <div className="nt-tools">
        <label className="nt-switch"><input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} /><span className="nt-knob" />Chỉ chưa đọc</label>
        <button className="nt-btn" disabled={!unread} onClick={readAll}><CheckCheck size={16} />Đánh dấu tất cả đã đọc</button>
      </div>
    </div>

    {error && <div className="nt-err" role="alert">{error} <button className="nt-btn" onClick={() => void load(0)}><RefreshCw size={14} />Thử lại</button></div>}

    {loading && !items.length && <div className="nt-list">{[0, 1, 2, 3].map(i => <div key={i} className="nt-skel"><i /><span><b /><b /></span></div>)}</div>}

    {sections.map(sec => <section key={sec.key} className="nt-sec">
      <h2>{sec.label}<span>{sec.rows.length}</span></h2>
      <div className="nt-list">
        {sec.rows.map(n => { const st = GROUP_STYLE[groupOf(n.type)]; const Icon = noticeIcon(n.type); const link = noticeLink(n);
          return <article key={n.id} className={'nt-item' + (n.is_read ? '' : ' unread')} role="link" tabIndex={0} onClick={() => void open(n)} onKeyDown={e => { if (e.key === 'Enter') void open(n); }}>
            <span className="nt-ico" aria-hidden style={{ background: st.bg, color: st.fg }}><Icon size={22} />{!n.is_read && <i className="nt-dot" />}</span>
            <div className="nt-body">
              <div className="nt-meta"><span className="nt-tag" style={{ background: st.bg, color: st.fg }}>{st.label}</span><time dateTime={n.created_at}>{timeAgo(n.created_at)}</time></div>
              <h3>{n.title}</h3>
              <p>{n.content}</p>
            </div>
            <div className="nt-act">
              {!n.is_read && <button className="nt-mini" title="Đánh dấu đã đọc" aria-label="Đánh dấu đã đọc" onClick={e => void readOne(e, n)}><CheckCheck size={16} /></button>}
              {link && <ChevronRight size={20} className="nt-go" />}
            </div>
          </article>; })}
      </div>
    </section>)}

    {!shown.length && !loading && !error && <div className="nt-empty">
      <div className="nt-empty-ico">{onlyUnread ? <CheckCheck size={40} /> : <BellOff size={40} />}</div>
      <h2>{onlyUnread ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo nào'}</h2>
      <p>{onlyUnread ? 'Tuyệt vời! Không còn thông báo nào chưa đọc.' : 'Khi có đơn hàng, tin nhắn hoặc cập nhật tin đăng, thông báo sẽ hiện ở đây.'}</p>
      <Link href="/" className="nt-btn primary"><Inbox size={16} />Về trang chủ</Link>
    </div>}

    {more && !loading && <div className="nt-more"><button className="nt-btn" onClick={() => void load(items.length)}>Xem thêm thông báo cũ hơn</button></div>}
    <p className="nt-foot"><Link href="/account">Về tài khoản</Link></p>
  </div>;
}
