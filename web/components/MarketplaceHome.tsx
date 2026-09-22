'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronLeft, ChevronRight, Flame, X, ArrowUp, Sparkles, Clock, Tag, CheckCircle2, Gift } from 'lucide-react';
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

function ProductCard({ product }: { product: Product }) {
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
      className="product-card"
      ref={cardRef}
      style={{ zIndex: menuOpen ? 9999 : 1, overflow: menuOpen ? 'visible' : 'hidden', position: 'relative' }}
    >
      <div className="card-img">
        <div className="badges">
          {isHot && <span className="badge hot">NỔI BẬT</span>}
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
        <span className="media-count-badge">📷 1/4</span>
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="card-title-full">{product.title}</h3>
          <div className="card-metadata">{metadataText}</div>
          <div className="price-row">
            <span className="price">{product.priceMode === 'CONTACT' ? 'LIÊN HỆ' : product.priceMode === 'FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>
          <div className="location-row">
            📍 {product.location || 'Quy Nhơn'}
          </div>
          <div className="card-seller-name">
            👤 {product.sellerName} <span className="verified-badge">✓ Đã xác thực</span>
          </div>
          <div className="card-posted-date">
            🕒 Đăng {new Date(product.postedAt).toLocaleDateString('vi-VN')}
          </div>
        </Link>

        <div className="card-footer-flex">
          <Link href={'/products/' + product.id} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}>
            💬 Nhắn tin
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

  // Unified Location Engine Selection
  const [locationSelection, setLocationSelection] = useState<LocationSelection>({
    mode: 'nationwide',
    label: 'Toàn quốc'
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'TODAY_DEALS' | 'NEARBY' | 'GIVEAWAY' | 'VERIFIED'>('FOR_YOU');

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
    if (locationSelection.mode === 'nationwide' || locationSelection.label === 'Toàn quốc') return true;
    if (!p.location) return true;
    const prodLocNorm = removeAccents(p.location);
    const targetLocNorm = removeAccents(locationSelection.label.replace(/.*\(|\).*/g, ''));
    return prodLocNorm.includes(targetLocNorm);
  });

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
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
      <section className="hero" style={{ paddingTop: 8 }}>
        <div className="shell">
          <div
            className="hero-banner-container"
            style={activeBanners.heroBanner ? { backgroundImage: `url(${activeBanners.heroBanner})` } : { backgroundImage: 'none' }}
          >
            <div className="hero-banner-bg" />
            <div className="hero-banner-overlay">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '0.2px' }}>
                  Mua bán mọi thứ, gần bạn!
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                  Hàng ngàn tin đăng mới mỗi ngày · Kết nối trực tiếp người mua & người bán
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

              {/* CHIP TỪ KHÓA TÌM KIẾM HOT */}
              <div className="hero-quick-keywords">
                <span>🔥 Từ khóa HOT:</span>
                <button onClick={() => { setSearchQuery('iPhone 15'); router.push('/?q=iPhone+15'); }}>iPhone 15</button>
                <button onClick={() => { setSearchQuery('Honda Vision'); router.push('/?q=Honda+Vision'); }}>Vision cũ</button>
                <button onClick={() => { setSearchQuery('Chung cư Quy Nhơn'); router.push('/?q=Chung+cư+Quy+Nhơn'); }}>Chung cư Quy Nhơn</button>
                <button onClick={() => { setSearchQuery('Tủ lạnh'); router.push('/?q=Tủ+lạnh'); }}>Tủ lạnh Inverter</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D CATEGORIES CAROUSEL */}
      <section className="shell" style={{ marginBottom: 16 }}>
        <div className="white-card-box" style={{ padding: '16px 20px', position: 'relative' }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            <h2><Flame color="#00a65a" size={22} /> Khám phá danh mục nổi bật</h2>
            <Link href="/categories" className="view-all">Xem tất cả danh mục →</Link>
          </div>

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
                  className="category-card-3d"
                >
                  <img src={cat.img} alt={cat.name} className="cat-3d-img" />
                  <span className="cat-title">{cat.name}</span>
                </Link>
              ))}
            </div>

            <button
              className="cat-scroll-arrow right"
              onClick={() => scrollCategories('right')}
              title="Cuộn sang phải"
            >
              <ChevronRight size={20} color="#0f172a" />
            </button>
          </div>
        </div>
      </section>

      {/* TABBED EXPLORE PRODUCTS SECTION WITH QUICK FILTER CHIPS */}
      <section className="shell" style={{ marginBottom: 40 }}>
        <div className="white-card-box" style={{ padding: '20px' }}>
          <div className="tabbed-header" style={{ marginBottom: 16, display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button
              className={`explore-tab-btn ${activeTab === 'FOR_YOU' ? 'active' : ''}`}
              onClick={() => setActiveTab('FOR_YOU')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Sparkles size={16} color="#00a65a" /> Dành cho bạn
            </button>
            <button
              className={`explore-tab-btn ${activeTab === 'NEARBY' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('NEARBY');
                setShowLocationModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <MapPin size={16} color="#00a65a" /> Gần bạn: {locationSelection.label}
            </button>
            <button
              className={`explore-tab-btn ${activeTab === 'TODAY_DEALS' ? 'active' : ''}`}
              onClick={() => setActiveTab('TODAY_DEALS')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Clock size={16} color="#f59e0b" /> Mới đăng hôm nay
            </button>
            <button
              className={`explore-tab-btn ${activeTab === 'VERIFIED' ? 'active' : ''}`}
              onClick={() => setActiveTab('VERIFIED')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={16} color="#059669" /> Đã xác thực
            </button>
            <button
              className={`explore-tab-btn ${activeTab === 'GIVEAWAY' ? 'active' : ''}`}
              onClick={() => setActiveTab('GIVEAWAY')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Gift size={16} color="#ef4444" /> Tặng miễn phí (0đ)
            </button>
          </div>

          <div className="products-grid-6">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(p => <ProductCard key={p.id} product={p} />)
            ) : (
              <p style={{ padding: 40, textAlign: 'center', color: '#64748b', gridColumn: 'span 6', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                Không tìm thấy bài đăng phù hợp tại khu vực <strong>{locationSelection.label}</strong>.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
