'use client';
import '../goi-dich-vu/billing.css';
import { useEffect, useState } from 'react';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest } from '../../lib/api';
import { moneyLabel } from '../../lib/order-ui';

type Stats = {
  days: number;
  totals: { activeListings: number; totalViews: string; newChats: number; newFavorites: number };
  orders: { total: number; completed: number; cancelled: number; revenue: string; inProgress: string; completionRate: number | null };
  daily: { day: string; orders: number; revenue: string }[];
  topListings: { id: string; title: string; views: string; status: string; chats: number; orders: number }[];
};

export default function StatsPage() { return <MemberArea>{() => <StatsView />}</MemberArea>; }

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="bl-card" style={{ margin: 0 }}><div style={{ color: '#71817b', fontSize: 13 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>{hint && <div style={{ color: '#71817b', fontSize: 12 }}>{hint}</div>}</div>;
}

function StatsView() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let on = true; setData(null); setError(''); memberRequest<Stats>(`/seller/stats?days=${days}`).then(d => { if (on) setData(d); }).catch(e => { if (on) setError(e instanceof Error ? e.message : 'Không tải được thống kê.'); }); return () => { on = false; }; }, [days]);
  const max = Math.max(1, ...(data?.daily.map(d => d.orders) ?? [1]));
  return <div className="bl" style={{ padding: 0 }}>
    <h1>Thống kê bán hàng</h1>
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{[7, 30, 90].map(d => <button key={d} className="bl-btn sm" style={days === d ? {} : { background: '#fff', color: '#333' }} onClick={() => setDays(d)}>{d} ngày qua</button>)}</div>
    {error && <div className="bl-msg err">{error}</div>}
    {!data && !error && <p>Đang tải…</p>}
    {data && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 12 }}>
        <Card label="Tin đang hiển thị" value={data.totals.activeListings} />
        <Card label="Tổng lượt xem" value={Number(data.totals.totalViews).toLocaleString('vi-VN')} hint="Từ khi bắt đầu đếm" />
        <Card label={`Chat mới (${days} ngày)`} value={data.totals.newChats} />
        <Card label={`Lượt lưu tin (${days} ngày)`} value={data.totals.newFavorites} />
        <Card label={`Đơn hàng (${days} ngày)`} value={data.orders.total} hint={data.orders.completionRate === null ? undefined : `${data.orders.completionRate}% hoàn tất`} />
        <Card label="Doanh thu thực nhận" value={moneyLabel(data.orders.revenue)} hint="Đơn đã hoàn tất, sau phí" />
        <Card label="Đang xử lý" value={moneyLabel(data.orders.inProgress)} hint="Giá trị đơn chưa hoàn tất" />
      </div>
      <div className="bl-card"><h3 style={{ marginTop: 0 }}>Đơn hàng theo ngày</h3>
        <div role="img" aria-label="Biểu đồ số đơn theo ngày" style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
          {data.daily.map(d => <div key={d.day} title={`${d.day}: ${d.orders} đơn`} style={{ flex: 1, minWidth: 2, height: `${Math.max(d.orders ? 6 : 1, (d.orders / max) * 100)}%`, background: d.orders ? '#00a65a' : '#dbe4dd', borderRadius: 2 }} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#71817b' }}><span>{data.daily[0]?.day}</span><span>{data.daily.at(-1)?.day}</span></div>
      </div>
      <div className="bl-card"><h3 style={{ marginTop: 0 }}>Tin nổi bật</h3>
        <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Tin</th><th>Lượt xem</th><th>Chat</th><th>Đơn</th></tr></thead><tbody>
          {data.topListings.map(t => <tr key={t.id}><td><a href={`/products/${t.id}`}>{t.title}</a><div style={{ fontSize: 12, color: '#71817b' }}>{t.status}</div></td><td>{Number(t.views).toLocaleString('vi-VN')}</td><td>{t.chats}</td><td>{t.orders}</td></tr>)}
          {!data.topListings.length && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>Chưa có tin đăng.</td></tr>}
        </tbody></table></div>
      </div>
    </>}
  </div>;
}
