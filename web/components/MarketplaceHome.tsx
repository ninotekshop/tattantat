'use client';

import { VipBadge } from './VipBadge';
import { Ic } from './Ic';
import { VideoBadge } from './VideoBadge';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ErrorDialog, isErrorMessage } from './ErrorDialog';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { readSession } from '../lib/auth';
import {
  Search, MapPin, ChevronLeft, ChevronRight, X, ArrowUp, Sparkles,
  Clock, CheckCircle2, Gift, List, Eye, Crown,
  MessageSquare, ChevronDown, Bell, Flag, Flame, Link2, Heart, Share2, EyeOff } from 'lucide-react';
import { api, apiGet, memberRequest, type Product } from '../lib/api';
import { useFavorites } from '../lib/favorites';
import { CATEGORY_ENGINE_TAXONOMY } from '../lib/marketplace';
import { LocationSelectorModal } from './LocationSelectorModal';
import { LocationSelection, removeAccents } from '../lib/locations';

function formatVnd(val: string) {
  return parseInt(val || '0', 10).toLocaleString('vi-VN') + 'đ';
}

function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card" style={{ opacity: 0.7, pointerEvents: 'none' }}>
      <div className="card-img skeleton-box" style={{ background: '#e2e8f0', height: 180 }} />
      <div className="card-body" style={{ gap: 8 }}>
        <div className="skeleton-box" style={{ height: 16, width: '85%', background: '#e2e8f0', borderRadius: 4 }} />
        <div className="skeleton-box" style={{ height: 12, width: '50%', background: '#f1f5f9', borderRadius: 4 }} />
        <div className="skeleton-box" style={{ height: 20, width: '60%', background: '#cbd5e1', borderRadius: 4, marginTop: 4 }} />
        <div className="skeleton-box" style={{ height: 12, width: '40%', background: '#f1f5f9', borderRadius: 4 }} />
      </div>
    </div>
  );
}

/** Icon lưới vẽ đúng số cột/hàng: nhìn là biết lưới 4 cột hay 6 cột. */
function GridIcon({ cols, rows, size = 18 }: { cols: number; rows: number; size?: number }) {
  const gap = cols > 4 ? 1 : 1.6, w = (20 - gap * (cols - 1)) / cols, h = (20 - gap * (rows - 1)) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(<rect key={r + '-' + c} x={2 + c * (w + gap)} y={2 + r * (h + gap)} width={w} height={h} rx={0.6} fill="currentColor" />);
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>{cells}</svg>;
}

function ProductCard({ product, viewMode = 'GRID_4' }: { product: Product; viewMode?: 'GRID_6' | 'GRID_4' | 'LIST' }) {
  const [failedImage, setFailedImage] = useState(false);
  const router = useRouter();
  const { isFavorite: isSaved, toggle } = useFavorites();
  const isFavorite = isSaved(product.id);
  const [favBusy, setFavBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('FRAUD');
  const [reportDetails, setReportDetails] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState('');
  const [errPopup, setErrPopup] = useState<string | null>(null);
  const flash = (msg: string) => { if (isErrorMessage(msg)) { setErrPopup(msg); return; } setToast(msg); window.setTimeout(() => setToast(''), 2600); };
  useEffect(() => {
    try { if ((JSON.parse(localStorage.getItem('tt-hidden-products') || '[]') as string[]).includes(product.id)) setHidden(true); } catch { /* bỏ qua */ }
  }, [product.id]);
  function hideForMe() {
    try {
      const list = JSON.parse(localStorage.getItem('tt-hidden-products') || '[]') as string[];
      localStorage.setItem('tt-hidden-products', JSON.stringify(Array.from(new Set([...list, product.id])).slice(-500)));
    } catch { /* bỏ qua */ }
    setHidden(true);
  }
  async function shareProduct() {
    const url = window.location.origin + '/products/' + product.id;
    try {
      if (navigator.share) { await navigator.share({ title: product.title, url }); return; }
      await navigator.clipboard.writeText(url);
      flash('Đã sao chép liên kết tin đăng!');
    } catch { flash('Không chia sẻ được, hãy thử lại.'); }
  }
  function openReport() {
    if (!readSession()) { router.push('/login?next=' + encodeURIComponent('/')); return; }
    setReportError(''); setReportOpen(true);
  }
  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (reportBusy) return;
    setReportBusy(true); setReportError('');
    try {
      await memberRequest('/reports', 'POST', { productId: product.id, reason: reportReason, details: reportDetails.trim() || undefined });
      setReportOpen(false); setReportDetails('');
      flash('Đã gửi báo cáo tới quản trị viên. Cảm ơn bạn!');
    } catch (err) { setReportError(err instanceof Error ? err.message : 'Không gửi được báo cáo. Hãy thử lại.'); }
    finally { setReportBusy(false); }
  }

  async function toggleFavorite() {
    if (favBusy) return;
    setFavBusy(true);
    try {
      const result = await toggle(product.id);
      if (result === 'login') router.push('/login?next=' + encodeURIComponent('/'));
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Không thể lưu tin yêu thích. Hãy thử lại.');
    } finally {
      setFavBusy(false);
    }
  }
  const cardRef = useRef<HTMLDivElement>(null);

  const isHot = product.status === 'PROMOTED';
  const isSale = product.priceMode === 'CONTACT';
  const isNew = !isHot && !isSale && new Date(product.postedAt).getTime() > Date.now() - 86400000;

  const metadataText = product.condition ? (CONDITION_TEXT[product.condition.toUpperCase().replace(/_/g, '')] ?? '') : '';

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (hidden) return null;

  return (
    <>
    <article
      className={`product-card ${viewMode === 'LIST' ? 'product-card-list' : ''}`}
      ref={cardRef}
      style={{ zIndex: menuOpen ? 9999 : 1, overflow: menuOpen ? 'visible' : 'hidden', position: 'relative' }}
    >
      <div className="card-img">
        <div className="badges">
          {isHot && <span className="badge hot"><Ic i={Crown}/>VIP</span>}
          {isSale && <span className="badge sale">GIẢM GIÁ</span>}
          {isNew && <span className="badge new">MỚI</span>}
        </div>

        <button
          className={`heart-btn ${isFavorite ? 'active' : ''}`}
          aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          aria-pressed={isFavorite}
          disabled={favBusy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void toggleFavorite();
          }}
        >
          <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        <Link href={'/products/' + product.id}>
          <img
            src={product.imageUrl && !failedImage ? product.imageUrl : '/assets/product-1.jpg'}
            alt={product.title}
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        </Link>
        <VideoBadge show={product.hasVideo} /><VipBadge show={product.isFeatured} />
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="card-title-full">{product.title}</h3>
          {metadataText && <div className="card-metadata">{metadataText}</div>}
          <div className="price-row">
            <span className="price">{product.priceMode === 'CONTACT' ? 'LIÊN HỆ' : product.priceMode === 'FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>

          <div className="location-row" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
            <MapPin size={13} /> {product.location || 'Quy Nhơn'}
          </div>
          
          <div className="card-posted-date" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
            <Clock size={13} /> Đăng {new Date(product.postedAt).toLocaleDateString('vi-VN')}
          </div>
        </Link>

        <div className="card-footer-flex">
          <Link href={'/messages?product=' + encodeURIComponent(product.id)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={14} /> Nhắn tin
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              className="card-more-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title="Tùy chọn"
            >
              •••
            </button>

            {menuOpen && (
              <div className="card-menu-dropdown-bottom">
                <div onClick={() => { void toggleFavorite(); setMenuOpen(false); }}>
                  {isFavorite ? <><Ic i={Heart}/>Bỏ lưu tin</> : <><Ic i={Heart} fill="currentColor"/>Lưu tin đăng</>}
                </div>
                <div onClick={() => { void shareProduct(); setMenuOpen(false); }}>
                  <Ic i={Share2}/>Chia sẻ tin
                </div>
                <div onClick={() => { void navigator.clipboard?.writeText(window.location.origin + '/products/' + product.id); flash('Đã sao chép liên kết tin đăng!'); setMenuOpen(false); }}>
                  <Ic i={Link2}/>Sao chép liên kết
                </div>
                <div onClick={() => { hideForMe(); setMenuOpen(false); }}>
                  <Ic i={EyeOff}/>Không quan tâm
                </div>
                <div onClick={() => { openReport(); setMenuOpen(false); }}>
                  <Ic i={Flag}/>Báo cáo vi phạm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
    <ErrorDialog message={errPopup || reportError} onClose={() => { setErrPopup(null); setReportError(''); }} />
    {typeof document !== 'undefined' && toast && createPortal(<div role="status" style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', background: '#0f3d2a', color: '#fff', padding: '10px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 600, zIndex: 100000, boxShadow: '0 8px 24px #0004' }}>{toast}</div>, document.body)}
    {typeof document !== 'undefined' && reportOpen && createPortal(
      <div role="dialog" aria-modal="true" aria-label="Báo cáo tin đăng" onClick={() => setReportOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100000, display: 'grid', placeItems: 'center', padding: 16 }}>
        <form onClick={e => e.stopPropagation()} onSubmit={submitReport} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 'min(440px, 100%)', display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Báo cáo tin đăng</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{product.title}</p>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>Lý do
            <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}>
              {Object.entries({ FRAUD: 'Nghi lừa đảo', SPAM: 'Tin rác / trùng lặp', PROHIBITED: 'Hàng cấm / vi phạm quy định', ABUSE: 'Nội dung xúc phạm', OTHER: 'Lý do khác' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>Mô tả thêm (không bắt buộc)
            <textarea rows={4} maxLength={1000} value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Ví dụ: người bán yêu cầu chuyển khoản trước rồi không giao hàng…" style={{ padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', font: 'inherit' }} />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setReportOpen(false)} disabled={reportBusy} style={{ padding: '9px 16px', borderRadius: 999, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" disabled={reportBusy} style={{ padding: '9px 18px', borderRadius: 999, border: 0, background: '#0a9a5c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{reportBusy ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
          </div>
        </form>
      </div>, document.body)}
    </>
  );
}

const CONDITION_TEXT: Record<string, string> = { NEW: 'Mới 100%', LIKENEW: 'Như mới', USEDLIKENEW: 'Như mới', USEDGOOD: 'Đã dùng, còn tốt', USEDFAIR: 'Đã dùng, có hao mòn', FORPARTS: 'Cần sửa / lấy linh kiện', REFURBISHED: 'Đã tân trang' };
export function MarketplaceHome({ query = '', group = '', sort = '', view = '' }: { query?: string; group?: string; sort?: string; view?: string }) {
  const router = useRouter();
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Default display minimum 12 items matrix
  const [visibleCount, setVisibleCount] = useState(12);
  type Filters = { minPrice: string; maxPrice: string; condition: string; verified: boolean; sortBy: string };
  const [filters, setFilters] = useState<Filters>({ minPrice: '', maxPrice: '', condition: '', verified: false, sortBy: 'new' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Chế độ xem mặc định: GRID_6 (6 tin/dòng)
  const [hotKeywords, setHotKeywords] = useState<string[]>(['iPhone 15', 'Honda Vision', 'Chung cư Quy Nhơn', 'Tủ lạnh Inverter']);
  useEffect(() => { let on = true; api.hotKeywords().then(r => { if (on && Array.isArray(r) && r.length) setHotKeywords(r); }).catch(() => {}); return () => { on = false; }; }, []);
  const [viewMode, setViewMode] = useState<'GRID_6' | 'GRID_4' | 'LIST'>('GRID_6');

  // Unified Location Engine Selection
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    mode: 'nationwide',
    label: 'Toàn quốc'
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Tabs include MOST_VIEWED and VIP
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'MOST_VIEWED' | 'VIP' | 'NEARBY' | 'TODAY_DEALS' | 'VERIFIED' | 'GIVEAWAY'>('FOR_YOU');

  // Ảnh nền mặc định cho form tìm kiếm khi chưa cấu hình banner Hero trong trang quản trị
  const [activeBanners, setActiveBanners] = useState<{
    leftBanner?: string;
    rightBanner?: string;
    heroBanner?: string;
    heroBanners?: string[];
  }>({});
  const [hero, setHero] = useState<{ cur: number; prev: number }>({ cur: 0, prev: -1 });
  const heroIndex = hero.cur;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Slide ảnh Hero (fade) khi có từ 2 banner trở lên
  const heroCount = activeBanners.heroBanners?.length ?? 0;
  useEffect(() => {
    if (heroCount < 2) { setHero(h => (h.cur === 0 && h.prev === -1 ? h : { cur: 0, prev: -1 })); return; }
    // Preload toàn bộ ảnh để lần chuyển đầu tiên không bị giật
    (activeBanners.heroBanners ?? []).forEach(src => { const im = new Image(); im.src = src; });
    const t = setInterval(() => setHero(h => ({ cur: (h.cur + 1) % heroCount, prev: h.cur < heroCount ? h.cur : -1 })), 5000);
    return () => clearInterval(t);
  }, [heroCount, activeBanners.heroBanners]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let cancelled = false;
    const pickBanners = (list: any[]) => {
      const active = list.filter((b: any) => b && b.status === 'ACTIVE' && b.imageUrl);
      const find = (key: string) => active.find((b: any) => String(b.position || '').includes(key))?.imageUrl;
      const heroBanners = Array.from(new Set<string>(active.filter((b: any) => String(b.position || '').includes('Hero')).map((b: any) => b.imageUrl as string)));
      return { leftBanner: find('Left'), rightBanner: find('Right'), heroBanner: heroBanners[0], heroBanners };
    };

    // Lấy banner đang hoạt động từ backend để mọi máy/trình duyệt đều thấy giống nhau
    const loadBanners = async () => {
      try {
        const res = await fetch('/api/v1/banners/active', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled || !Array.isArray(json?.data)) return;
        const picked = pickBanners(json.data);
        // Không có Hero banner đang hoạt động → dùng nền xanh thương hiệu (CSS .hero-banner-container)
        setActiveBanners(picked);
      } catch {
        // Backend chưa sẵn sàng: dùng nền xanh thương hiệu cho form tìm kiếm
        if (!cancelled) setActiveBanners({});
      }
    };

    loadBanners();
    window.addEventListener('tattantat-banner-change', loadBanners);
    return () => {
      cancelled = true;
      window.removeEventListener('tattantat-banner-change', loadBanners);
    };
  }, []);

  // "Quanh tôi": đổi tọa độ GPS thành quận/huyện + tỉnh để lọc theo địa chỉ tin đăng.
  const [area, setArea] = useState<{ key: string; district: string; province: string } | null>(null);
  const nearbyKey = locationSelection.mode === 'nearby' ? `${locationSelection.latitude},${locationSelection.longitude}` : '';
  useEffect(() => {
    if (!nearbyKey) return;
    let on = true;
    const [lat, lng] = nearbyKey.split(',');
    apiGet<{ district: string; province: string }>(`/geo/area?lat=${lat}&lng=${lng}`)
      .then(r => { if (on) setArea({ key: nearbyKey, district: r.district || '', province: r.province || '' }); })
      .catch(() => { if (on) setArea({ key: nearbyKey, district: '', province: '' }); });
    return () => { on = false; };
  }, [nearbyKey]);
  const cleanArea = (n: string) => n.replace(/^(thành phố|tỉnh|quận|huyện|thị xã|thị trấn|tp\.?)\s+/i, '').trim();
  const nearbyReady = !nearbyKey || area?.key === nearbyKey;
  const nearbyDistrict = nearbyKey && area?.key === nearbyKey ? cleanArea(area.district) : '';
  const nearbyProvince = nearbyKey && area?.key === nearbyKey ? cleanArea(area.province) : '';
  const locationParam = locationSelection.mode === 'nationwide' || locationSelection.label === 'Toàn quốc' ? ''
    : locationSelection.mode === 'nearby' ? ((locationSelection.radiusKm ?? 10) >= 20 ? nearbyProvince : (nearbyDistrict || nearbyProvince))
    : locationSelection.label.replace(/.*\(|\).*/g, '').trim();
  const searchParams = () => ({ q: query, minPrice: filters.minPrice.replace(/\D/g, ''), maxPrice: filters.maxPrice.replace(/\D/g, ''), condition: filters.condition, verified: filters.verified || (activeTab === 'VERIFIED'), location: locationParam, sort: filters.sortBy, limit: 24 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!nearbyReady) return;
      setIsLoading(true); setPage(1);
      try {
        let res = await api.search(searchParams()).catch(() => ({ items: [] as Product[], total: 0, page: 1, limit: 24 }));
        // Quận/huyện chưa có tin: mở rộng ra cả tỉnh để vẫn thấy tin gần bạn.
        if (res.total === 0 && locationSelection.mode === 'nearby' && nearbyProvince && nearbyProvince !== locationParam) {
          res = await api.search({ ...searchParams(), location: nearbyProvince }).catch(() => res);
        }
        if (!cancelled) { setProducts(res.items); setTotal(res.total); setVisibleCount(res.items.length || 12); }
      } catch (err) {} finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, locationParam, nearbyReady, activeTab === 'VERIFIED']);

  async function loadMore() {
    if (loadingMore) return; setLoadingMore(true);
    try {
      const res = await api.search({ ...searchParams(), page: page + 1 });
      setProducts(prev => [...prev, ...res.items.filter(i => !prev.some(p => p.id === i.id))]); setPage(page + 1); setTotal(res.total);
      setVisibleCount(c => c + res.items.length);
    } catch {} finally { setLoadingMore(false); }
  }

  async function saveSearch() {
    setSaveMsg('');
    try {
      const { minPrice, maxPrice, condition, verified } = filters;
      await memberRequest('/me/saved-searches', 'POST', { params: { q: query, minPrice: minPrice.replace(/\D/g, ''), maxPrice: maxPrice.replace(/\D/g, ''), condition, verified, location: locationParam } });
      setSaveMsg('Đã lưu tìm kiếm — bạn sẽ được báo khi có tin mới phù hợp.');
    } catch (e) { setSaveMsg(e instanceof Error ? e.message : 'Không lưu được tìm kiếm.'); }
  }

  const searchSuggestions = [
    'iPhone 15 Pro Max',
    'Xe máy Honda Vision cũ',
    'Laptop Dell Core i7',
    'Nhà mặt tiền Quy Nhơn',
    'Tủ lạnh Inverter',
    'Việc làm bán thời gian'
  ].filter(s => searchQuery && removeAccents(s).includes(removeAccents(searchQuery)));

  const filteredProducts = products.filter(p => {
    if (activeTab === 'GIVEAWAY') {
      if (p.priceMode !== 'FREE' && p.price !== '0') return false;
    }
    if (activeTab === 'VIP') {
      if (p.status !== 'PROMOTED') return false;
    }
    return true;
  });

  const displayedProducts = filteredProducts;

  // Smooth sliding scroll for category logos
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    router.push('/?q=' + encodeURIComponent(searchQuery));
  }

  const cats = CATEGORY_ENGINE_TAXONOMY.map(cat => ({
    name: cat.label,
    img: cat.icon,
    slug: cat.key
  }));

  return (
    <main id="home">
      {/* LOCATION SELECTOR MODAL */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(selection) => setLocationSelection(selection)}
        currentSelection={locationSelection}
      />

      {/* BACK TO TOP FLOATING BUTTON */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          title="Quay lại đầu trang"
          aria-label="Quay lại đầu trang"
          className="back-to-top-btn"
          style={{
            position: 'fixed',
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: '#00a65a',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 20px rgba(0, 166, 90, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'all 0.25s ease'
          }}
        >
          <ArrowUp size={22} color="#ffffff" strokeWidth={2.6} />
        </button>
      )}

      {/* FLOATING BANNERS */}
      {activeBanners.leftBanner && (
        <div className="floating-banner left-floating-banner">
          <Link href="/sell">
            <img src={activeBanners.leftBanner} alt="Quảng cáo Tất Tần Tật" />
          </Link>
        </div>
      )}
      {activeBanners.rightBanner && (
        <div className="floating-banner right-floating-banner">
          <Link href="/sell">
            <img src={activeBanners.rightBanner} alt="Quảng cáo Tất Tần Tật" />
          </Link>
        </div>
      )}

      {/* HERO BANNER & SEARCH BAR */}
      <section className="hero" style={{ paddingTop: 0 }}>
        <div className="shell" style={{ padding: '0 8px' }}>
          <div
            className="hero-banner-container hero-flush-top"
          >
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            {(activeBanners.heroBanners ?? []).map((src, i) => (
              <div
                key={src}
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0, backgroundImage: `url(${src})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  // Ảnh mới mờ dần hiện lên TRÊN ảnh cũ (ảnh cũ giữ nguyên đến khi ảnh mới đã hiện đủ) → không bị chớp tối giữa 2 ảnh
                  opacity: i === heroIndex || i === hero.prev ? 1 : 0,
                  zIndex: i === heroIndex ? 2 : i === hero.prev ? 1 : 0,
                  transition: i === heroIndex ? 'opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                  willChange: 'opacity', pointerEvents: 'none',
                }}
              />
            ))}
            </div>
            <div className="hero-banner-bg" />
            <div className="hero-banner-overlay" style={{ maxWidth: 660 }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <h1 style={{ fontSize: 25, fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '0.2px', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  Mua bán dễ dàng - Kết nối mọi người
                </h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.95)', margin: 0, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                  Hàng ngàn tin đăng mới mỗi ngày · Mua bán trực tiếp tại khu vực của bạn
                </p>
              </div>

              <form className="search-box" onSubmit={handleSearch} style={{ position: 'relative' }}>
                <div className="search-input-group">
                  <Search color="#00a65a" size={20} />
                  <input
                    type="text"
                    placeholder="Bạn muốn mua gì?"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={16} color="#888" />
                    </button>
                  )}
                </div>
                <div className="search-divider"></div>

                {/* LOCATION SELECTOR TRIGGER */}
                <div className="search-location-wrapper">
                  <div
                    className="search-location"
                    onClick={() => setShowLocationModal(true)}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#0f172a' }}
                  >
                    <MapPin size={17} color="#00a65a" /> {locationSelection.label} ▾
                  </div>
                </div>

                <button type="submit" className="search-submit-btn">Tìm kiếm</button>

                {/* AUTOCOMPLETE SUGGESTIONS */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions-dropdown">
                    {searchSuggestions.map((sug) => (
                      <div
                        key={sug}
                        className="suggestion-item"
                        onClick={() => {
                          setSearchQuery(sug);
                          setShowSuggestions(false);
                          router.push('/?q=' + encodeURIComponent(sug));
                        }}
                      >
                        <Search size={15} color="#00a65a" /> {sug}
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* CENTER-ALIGNED HOT KEYWORDS */}
              <div className="hero-quick-keywords" style={{ justifyContent: 'center', textAlign: 'center', width: '100%', marginTop: 14 }}>
                <span style={{ fontWeight: 700, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}><Ic i={Flame}/>Từ khóa HOT:</span>
                {hotKeywords.map(k => (
                  <button key={k} onClick={() => { setSearchQuery(k); router.push(`/?q=${encodeURIComponent(k)}`); }}>{k}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D CATEGORIES CAROUSEL - COMPACT CARD CONTAINER WITH GLOW & SMOOTH SCROLL */}
      <section className="shell" style={{ marginBottom: 16 }}>
        <div className="white-card-box" style={{ padding: '8px 14px', position: 'relative' }}>
          <div className="category-carousel-wrapper">
            <button
              className="cat-scroll-arrow left"
              onClick={() => scrollCategories('left')}
              title="Cuộn sang trái"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="category-grid-scroll" ref={categoryScrollRef}>
              {cats.map((cat) => (
                <Link
                  key={cat.slug}
                  href={cat.slug === 'all' ? '/categories' : `/categories?cat=${cat.slug}`}
                  className="category-card-3d-large"
                >
                  <img src={cat.img} alt={cat.name} className="cat-3d-img-large" />
                  <span className="cat-title-large">{cat.name}</span>
                </Link>
              ))}
            </div>

            <button
              className="cat-scroll-arrow right"
              onClick={() => scrollCategories('right')}
              title="Cuộn sang phía sau"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* TABBED EXPLORE PRODUCTS SECTION - LEFT ALIGNED TABS & COMPACT VIEW SWITCHER ON SAME ROW */}
      <section className="shell" style={{ marginBottom: 40 }}>
        <div className="white-card-box" style={{ padding: '18px 20px' }}>
          {/* SINGLE HEADER ROW: LEFT-ALIGNED COMPACT TABS + RIGHT-ALIGNED ICON-ONLY SWITCHER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            <div className="tabbed-header-left" style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px 0', alignItems: 'center', flex: 1 }}>
              <button
                className={`explore-tab-btn ${activeTab === 'FOR_YOU' ? 'active' : ''}`}
                onClick={() => setActiveTab('FOR_YOU')}
              >
                <Sparkles size={14} /> Dành cho bạn
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'MOST_VIEWED' ? 'active' : ''}`}
                onClick={() => setActiveTab('MOST_VIEWED')}
              >
                <Eye size={14} /> Xem nhiều nhất
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'VIP' ? 'active' : ''}`}
                onClick={() => setActiveTab('VIP')}
              >
                <Crown size={14} /> Tin đăng VIP
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'NEARBY' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('NEARBY');
                  setShowLocationModal(true);
                }}
              >
                <MapPin size={14} /> Gần bạn
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'TODAY_DEALS' ? 'active' : ''}`}
                onClick={() => setActiveTab('TODAY_DEALS')}
              >
                <Clock size={14} /> Mới đăng hôm nay
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'VERIFIED' ? 'active' : ''}`}
                onClick={() => setActiveTab('VERIFIED')}
              >
                <Ic i={CheckCircle2} size={14}/>Đã xác thực
              </button>
              <button
                className={`explore-tab-btn ${activeTab === 'GIVEAWAY' ? 'active' : ''}`}
                onClick={() => setActiveTab('GIVEAWAY')}
              >
                <Gift size={14} /> Tặng miễn phí (0đ)
              </button>
            </div>

            {/* VIEW MODE SWITCHER ON SAME ROW - ICONS ONLY (REQ 5) */}
            <div className="view-mode-switcher" style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#f8fafc', padding: 3, borderRadius: 10, border: '1px solid #e2e8f0', flexShrink: 0 }}>
              <button
                onClick={() => setViewMode('GRID_4')}
                className={`view-mode-btn ${viewMode === 'GRID_4' ? 'active' : ''}`}
                title="Lưới 4 cột (mặc định)" aria-label="Lưới 4 cột"
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: viewMode === 'GRID_4' ? '#ffffff' : 'transparent', color: viewMode === 'GRID_4' ? '#00a65a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'GRID_4' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              >
                <GridIcon cols={4} rows={3} />
              </button>
              <button
                onClick={() => setViewMode('GRID_6')}
                className={`view-mode-btn ${viewMode === 'GRID_6' ? 'active' : ''}`}
                title="Lưới 6 cột" aria-label="Lưới 6 cột"
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: viewMode === 'GRID_6' ? '#ffffff' : 'transparent', color: viewMode === 'GRID_6' ? '#00a65a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'GRID_6' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              >
                <GridIcon cols={6} rows={3} />
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`view-mode-btn ${viewMode === 'LIST' ? 'active' : ''}`}
                title="Hiển thị dạng danh sách" aria-label="Dạng danh sách"
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: viewMode === 'LIST' ? '#ffffff' : 'transparent', color: viewMode === 'LIST' ? '#00a65a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'LIST' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              >
                <List size={17} />
              </button>
            </div>
          </div>

          {/* PRODUCT MATRIX (DEFAULT: GRID_4 / LƯỚI 4X3) */}
          <div className={viewMode === 'GRID_4' ? 'products-grid-4' : viewMode === 'GRID_6' ? 'products-grid-6' : 'products-list-container'}>
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : displayedProducts.length > 0 ? (
              displayedProducts.map(p => <ProductCard key={p.id} product={p} viewMode={viewMode} />)
            ) : (
              <p style={{ padding: 40, textAlign: 'center', color: '#64748b', gridColumn: '1 / -1', width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                Không tìm thấy bài đăng phù hợp tại khu vực <strong>{locationSelection.label}</strong>.
              </p>
            )}
          </div>

          {/* LOAD MORE BUTTON ("XEM THÊM") */}
          {!isLoading && products.length < total && (
            <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
              <button
                onClick={() => void loadMore()} disabled={loadingMore}
                style={{
                  background: 'linear-gradient(135deg, #00a65a 0%, #008247 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 166, 90, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {loadingMore ? 'Đang tải…' : 'Xem thêm tin đăng khác'} <ChevronDown size={18} />
              </button>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 8 }}>
                Đang hiển thị {products.length} / {total} tin đăng
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
