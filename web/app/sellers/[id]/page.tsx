'use client';
import { Ic } from '../../../components/Ic';
import { BadgeCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Stars } from '../../../components/reviews/Stars';

type Profile = { user: { name: string; avatarUrl: string | null; verified: boolean; joinedAt: string; activeListings: number }; role: 'seller' | 'buyer'; summary: { count: number; average: number; distribution: Record<string, number> };
  reviews: { id: string; rating: number; comment: string | null; reply: string | null; created_at: string; author_name: string }[] };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #e0e9e4', borderRadius: 14, padding: 18, marginBottom: 16 };

function joined(iso: string) {
  const months = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (30 * 86_400_000)));
  return months < 1 ? 'Mới tham gia' : months < 12 ? `Đã tham gia ${months} tháng` : `Đã tham gia ${Math.floor(months / 12)} năm`;
}

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [p, setP] = useState<Profile | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    let live = true; setP(null); setError('');
    fetch(`/api/v1/users/${encodeURIComponent(id)}/reviews?role=${role}`).then(r => r.json()).then(j => { if (!live) return; if (j?.success) setP(j.data); else setError(j?.message || 'Không tải được hồ sơ.'); }).catch(() => live && setError('Không tải được hồ sơ.'));
    return () => { live = false; };
  }, [id, role]);
  const max = p ? Math.max(1, ...Object.values(p.summary.distribution)) : 1;
  return <main className="shell" style={{ marginTop: 24, marginBottom: 48, maxWidth: 820 }}>
    <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}><Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> / <span style={{ color: '#00a65a', fontWeight: 600 }}>Hồ sơ thành viên</span></nav>
    {error && <p role="alert" style={{ color: '#a64329' }}>{error}</p>}
    {!p && !error && <p>Đang tải…</p>}
    {p && <>
      <section style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {p.user.avatarUrl ? <img src={p.user.avatarUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e6f6ed', display: 'grid', placeItems: 'center', fontSize: 28, color: '#007c4b', fontWeight: 800 }}>{p.user.name.slice(0, 1).toUpperCase()}</div>}
        <div><h1 style={{ margin: 0, fontSize: 22 }}>{p.user.name} {p.user.verified && <span style={{ fontSize: 12, background: '#dff3e6', color: '#137a4a', borderRadius: 10, padding: '2px 9px', verticalAlign: 'middle' }}><Ic i={BadgeCheck}/>Đã xác minh</span>}</h1>
          <div style={{ color: '#64748b', fontSize: 13.5 }}>{joined(p.user.joinedAt)} · {p.user.activeListings} tin đang đăng</div></div>
      </section>
      <section style={card}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{([['seller', 'Khi bán hàng'], ['buyer', 'Khi mua hàng']] as const).map(([k, l]) =>
          <button key={k} onClick={() => setRole(k)} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid ' + (role === k ? '#008954' : '#dce6e0'), background: role === k ? '#e6f6ed' : '#fff', fontWeight: 700, cursor: 'pointer' }}>{l}</button>)}</div>
        {p.summary.count === 0 ? <p style={{ color: '#71817b' }}>Chưa có đánh giá nào.</p> : <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40, fontWeight: 800, color: '#007c4b' }}>{p.summary.average.toFixed(1)}</div><Stars value={p.summary.average} size={20} /><div style={{ color: '#71817b', fontSize: 12.5 }}>{p.summary.count} đánh giá</div></div>
          <div style={{ flex: 1, minWidth: 220 }}>{[5, 4, 3, 2, 1].map(n => <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}><span style={{ width: 24 }}>{n}<Ic i={Star} fill="#f5a623" style={{ color: '#f5a623', marginRight: 0, marginLeft: 2 }}/></span>
            <div style={{ flex: 1, background: '#eef3f0', height: 8, borderRadius: 4 }}><div style={{ width: `${(p.summary.distribution[n] / max) * 100}%`, background: '#f5a623', height: 8, borderRadius: 4 }} /></div><span style={{ width: 28, textAlign: 'right' }}>{p.summary.distribution[n]}</span></div>)}</div></div>}
      </section>
      {p.reviews.map(r => <article key={r.id} style={card}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><b>{r.author_name}</b><span style={{ color: '#71817b', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('vi-VN')}</span></div>
        <Stars value={r.rating} />{r.comment && <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{r.comment}</p>}
        {r.reply && <div style={{ background: '#f4f8f6', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 13.5 }}><b>Phản hồi từ {p.user.name}:</b> {r.reply}</div>}</article>)}
    </>}
  </main>;
}
