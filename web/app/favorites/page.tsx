'use client';
import './favorites.css';
import { SellerAvatar } from '../../components/SellerAvatar';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, Search } from 'lucide-react';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest, type Product } from '../../lib/api';
import { useFavorites } from '../../lib/favorites';
import { listingPrice } from '../../lib/listings';
import { VideoBadge } from '../../components/VideoBadge';

type Sort = 'recent' | 'price-asc' | 'price-desc';
const numericPrice = (p: Product) => (p.priceMode === 'CONTACT' || p.priceMode === 'FREE' ? 0 : Number(String(p.price).replace(/\.0+$/, '')) || 0);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function FavoritesPage() {
  return <MemberArea>{() => <Favorites />}</MemberArea>;
}

function Favorites() {
  const { toggle } = useFavorites();
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    memberRequest<Product[]>('/favorites')
      .then(list => { if (active) setItems(list); })
      .catch(e => { if (active) { setItems([]); setError(e instanceof Error ? e.message : 'Không tải được danh sách yêu thích.'); } });
    return () => { active = false; };
  }, [attempt]);

  const shown = useMemo(() => {
    const q = norm(query.trim());
    const list = (items ?? []).filter(p => !q || norm(p.title).includes(q) || norm(p.location || '').includes(q));
    if (sort === 'price-asc') return [...list].sort((a, b) => numericPrice(a) - numericPrice(b));
    if (sort === 'price-desc') return [...list].sort((a, b) => numericPrice(b) - numericPrice(a));
    return list; // 'recent': máy chủ đã sắp theo thời điểm lưu, mới nhất trước
  }, [items, query, sort]);

  async function remove(id: string) {
    if (busyId) return;
    setBusyId(id); setError('');
    try { await toggle(id); setItems(prev => (prev ?? []).filter(p => p.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không bỏ được yêu thích. Hãy thử lại.'); }
    finally { setBusyId(''); }
  }

  const total = items?.length ?? 0;
  return (
    <div className="fav-wrap">
      <header className="fav-head">
        <div>
          <h1 className="fav-title"><Heart size={26} /> Tin yêu thích {items && total > 0 && <span className="fav-count">{total}</span>}</h1>
          <p className="fav-sub">Những tin bạn đã lưu để xem lại hoặc liên hệ sau.</p>
        </div>
        {total > 0 && (
          <div className="fav-tools">
            <label className="fav-search"><Search size={16} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong tin đã lưu" aria-label="Tìm trong tin đã lưu" />
            </label>
            <select className="fav-sort" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sắp xếp">
              <option value="recent">Mới lưu trước</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        )}
      </header>

      {error && <p className="fav-note" role="alert">{error} {items?.length === 0 && <button style={{ marginLeft: 8, textDecoration: 'underline', background: 'none', border: 0, color: 'inherit', cursor: 'pointer' }} onClick={() => { setItems(null); setAttempt(n => n + 1); }}>Thử lại</button>}</p>}

      {items === null ? (
        <div className="fav-grid">{Array.from({ length: 4 }, (_, i) => <div className="fav-skel" key={i} />)}</div>
      ) : total === 0 && !error ? (
        <div className="fav-empty">
          <Heart size={48} />
          <h2>Bạn chưa lưu tin nào</h2>
          <p>Bấm biểu tượng trái tim trên tin đăng để lưu lại và xem lại tại đây.</p>
          <Link href="/">Khám phá tin đăng</Link>
        </div>
      ) : shown.length === 0 && total > 0 ? (
        <div className="fav-empty"><Search size={44} /><h2>Không có tin nào khớp “{query}”</h2><p>Thử từ khóa khác hoặc xóa ô tìm kiếm.</p><button onClick={() => setQuery('')}>Xóa tìm kiếm</button></div>
      ) : (
        <div className="fav-grid">
          {shown.map(p => (
            <article className="fav-card" key={p.id}>
              <Link className="fav-img" href={'/products/' + p.id} aria-label={p.title}>
                <img src={p.imageUrl || '/assets/product-1.jpg'} alt={p.title} loading="lazy"
                  onError={e => { const img = e.currentTarget; if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = '/assets/product-1.jpg'; } }} />
                <VideoBadge show={p.hasVideo} />
              </Link>
              <button className="fav-remove" title="Bỏ yêu thích" aria-label={'Bỏ yêu thích: ' + p.title} disabled={busyId === p.id} onClick={() => void remove(p.id)}><Heart size={17} /></button>
              <div className="fav-body">
                <Link className="fav-name" href={'/products/' + p.id}>{p.title}</Link>
                <div className="fav-price">{listingPrice({ price: String(p.price).replace(/\.0+$/, ''), priceMode: p.priceMode || 'FIXED' })}</div>
                <div className="fav-meta"><MapPin size={14} /><span>{p.location || 'Chưa cập nhật'}</span></div>
                <div className="fav-meta"><SellerAvatar name={p.sellerName} url={p.sellerAvatar} size={18} /><span>{p.sellerName}</span></div>
                <div className="fav-foot">
                  <Link className="fav-btn primary" href={'/messages?product=' + encodeURIComponent(p.id)}>Nhắn tin</Link>
                  <Link className="fav-btn" href={'/products/' + p.id}>Xem tin</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
