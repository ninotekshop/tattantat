'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, ChevronLeft, ChevronRight, X, ArrowUp, Sparkles,
  Clock, CheckCircle2, Gift, LayoutGrid, Grid3x3, List, Eye, Crown,
  User, MessageSquare, ChevronDown
} from 'lucide-react';
import { api, type Product } from '../lib/api';
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

function ProductCard({ product, viewMode = 'GRID_4' }: { product: Product; viewMode?: 'GRID_6' | 'GRID_4' | 'LIST' }) {
  const [failedImage, setFailedImage] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isHot = product.status === 'PROMOTED';
  const isSale = product.priceMode === 'CONTACT';
  const isNew = !isHot && !isSale && new Date(product.postedAt).getTime() > Date.now() - 86400000;

  const metadataText = product.title.includes('iPhone') ? '256GB · Chính chủ'
    : product.title.includes('Nhà') ? '80m² · 3 tầng'
    : product.title.includes('Xe') ? 'Honda · 12.000 km'
    : 'Chất lượng cao · Hàng đẹp';

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

  return (
    <article
      className={`product-card ${viewMode === 'LIST' ? 'product-card-list' : ''}`}
      ref={cardRef}
      style={{ zIndex: menuOpen ? 9999 : 1, overflow: menuOpen ? 'visible' : 'hidden', position: 'relative' }}
    >
      <div className="card-img">
        <div className="badges">
          {isHot && <span className="badge hot">👑 VIP</span>}
          {isSale && <span className="badge sale">GIẢM GIÁ</span>}
          {isNew && <span className="badge new">MỚI</span>}
        </div>

        <button
          className={`heart-btn ${isFavorite ? 'active' : ''}`}
          aria-label="Yêu thích"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
        >
          {isFavorite ? '♥' : '♡'}
        </button>

        <Link href={'/products/' + product.id}>
          <img
            src={product.imageUrl && !failedImage ? product.imageUrl : '/assets/product-1.jpg'}
            alt={product.title}
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        </Link>
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="card-title-full">{product.title}</h3>
          <div className="card-metadata">{metadataText}</div>
          <div className="price-row">
            <span className="price">{product.priceMode === 'CONTACT' ? 'LIÊN HỆ' : product.priceMode === 'FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>

          <div className="location-row" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
            <MapPin size={13} color="#64748b" /> {product.location || 'Quy Nhơn'}
          </div>
          <div className="card-seller-name" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#475569' }}>
            <User size={13} color="#64748b" /> {product.sellerName} <span className="verified-badge">✓ Đã xác thực</span>
          </div>
          <div className="card-posted-date" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b' }}>
            <Clock size={13} color="#64748b" /> Đăng {new Date(product.postedAt).toLocaleDateString('vi-VN')}
          </div>
        </Link>

        <div className="card-footer-flex">
          <Link href={'/products/' + product.id} style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MessageSquare size={14} color="#334155" /> Nhắn tin
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
                <div onClick={() => { setIsFavorite(!isFavorite); setMenuOpen(false); }}>
                  {isFavorite ? '♡ Bỏ lưu tin' : '♥ Lưu tin đăng'}
                </div>
                <div onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/products/' + product.id); alert('Đã sao chép liên kết tin đăng!'); setMenuOpen(false); }}>
                  🔗 Chia sẻ tin
                </div>
                <div onClick={() => { alert('Đã gửi báo cáo vi phạm!'); setMenuOpen(false); }}>
                  🚩 Báo cáo vi phạm
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

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

  // Default view mode: GRID_4 (Lưới 4x3) across all pages
  const [viewMode, setViewMode] = useState<'GRID_6' | 'GRID_4' | 'LIST'>('GRID_4');

  // Unified Location Engine Selection
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    mode: 'nationwide',
    label: 'Toàn quốc'
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Tabs include MOST_VIEWED and VIP
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'MOST_VIEWED' | 'VIP' | 'NEARBY' | 'TODAY_DEALS' | 'VERIFIED' | 'GIVEAWAY'>('FOR_YOU');

  const [activeBanners, setActiveBanners] = useState<{
    leftBanner?: string;
    rightBanner?: string;
    heroBanner?: string;
  }>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadBanners = () => {
      try {
        const saved = localStorage.getItem('tattantat_banners');
        if (saved) {
          const parsed = JSON.parse(saved);
          const left = parsed.find((b: any) => b.position.includes('Left') && b.status === 'ACTIVE');
          const right = parsed.find((b: any) => b.position.includes('Right') && b.status === 'ACTIVE');
          const hero = parsed.find((b: any) => b.position.includes('Hero') && b.status === 'ACTIVE');
          setActiveBanners({
            leftBanner: left?.imageUrl,
            rightBanner: right?.imageUrl,
            heroBanner: hero?.imageUrl,
          });
        }
      } catch (err) {}
    };

    loadBanners();
    window.addEventListener('storage', loadBanners);
    window.addEventListener('tattantat-banner-change', loadBanners);
    return () => {
      window.removeEventListener('storage', loadBanners);
      window.removeEventListener('tattantat-banner-change', loadBanners);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const prodData = await api.products(query).catch(() => []);
        if (!cancelled) setProducts(prodData);
      } catch (err) {} finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [query]);

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
    if (locationSelection.mode === 'nationwide' || locationSelection.label === 'Toàn quốc') return true;
    if (!p.location) return true;
    const prodLocNorm = removeAccents(p.location);
    const targetLocNorm = removeAccents(locationSelection.label.replace(/.*\(|\).*/g, ''));
    return prodLocNorm.includes(targetLocNorm);
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

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
          style={{
            position: 'fixed',
            bottom: 32,
            right: 28,
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
          <ArrowUp size={22} />
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
            style={activeBanners.heroBanner ? { backgroundImage: `url(${activeBanners.heroBanner})` } : { backgroundImage: 'none' }}
          >
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
                <span style={{ fontWeight: 700, color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>🔥 Từ khóa HOT:</span>
                <button onClick={() => { setSearchQuery('iPhone 15'); router.push('/?q=iPhone+15'); }}>iPhone 15</button>
                <button onClick={() => { setSearchQuery('Honda Vision'); router.push('/?q=Honda+Vision'); }}>Vision cũ</button>
                <button onClick={() => { setSearchQuery('Chung cư Quy Nhơn'); router.push('/?q=Chung+cư+Quy+Nhơn'); }}>Chung cư Quy Nhơn</button>
                <button onClick={() => { setSearchQuery('Tủ lạnh'); router.push('/?q=Tủ+lạnh'); }}>Tủ lạnh Inverter</button>
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
              <ChevronLeft size={20} color="#0f172a" />
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
              <ChevronRight size={20} color="#0f172a" />
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
                <CheckCircle2 size={14} /> Đã xác thực
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
                title="Lưới 4x3 (Mặc định)"
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: viewMode === 'GRID_4' ? '#ffffff' : 'transparent', color: viewMode === 'GRID_4' ? '#00a65a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'GRID_4' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              >
                <Grid3x3 size={17} />
              </button>
              <button
                onClick={() => setViewMode('GRID_6')}
                className={`view-mode-btn ${viewMode === 'GRID_6' ? 'active' : ''}`}
                title="Lưới 6 cột"
                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: viewMode === 'GRID_6' ? '#ffffff' : 'transparent', color: viewMode === 'GRID_6' ? '#00a65a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: viewMode === 'GRID_6' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`view-mode-btn ${viewMode === 'LIST' ? 'active' : ''}`}
                title="Hiển thị dạng Danh sách"
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
              <p style={{ padding: 40, textAlign: 'center', color: '#64748b', gridColumn: 'span 4', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                Không tìm thấy bài đăng phù hợp tại khu vực <strong>{locationSelection.label}</strong>.
              </p>
            )}
          </div>

          {/* LOAD MORE BUTTON ("XEM THÊM") */}
          {!isLoading && filteredProducts.length > visibleCount && (
            <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 16, borderTop: '1px dashed #e2e8f0' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
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
                Xem thêm tin đăng khác <ChevronDown size={18} />
              </button>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 8 }}>
                Đang hiển thị {displayedProducts.length} / {filteredProducts.length} tin đăng
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
