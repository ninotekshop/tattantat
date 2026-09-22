'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight, ArrowRightCircle, MessageSquare, X } from 'lucide-react';
import { api, type Product } from '../lib/api';

function formatVnd(val: string) {
  return parseInt(val || '0').toLocaleString('vi-VN') + 'đ';
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

  // Click outside listener for menu dropdown
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

        <span className="media-count-badge">🖼 6</span>

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
        <Link href={'/products/' + product.id} style={{textDecoration:'none', color:'inherit'}}>
          {/* NỘI DUNG TIN ĐĂNG HIỂN THỊ ĐẦY ĐỦ (KHÔNG ĐỂ ...) */}
          <h3 className="card-title-full">{product.title}</h3>
          <div className="card-metadata">{metadataText}</div>
          <div className="price-row">
            <span className="price">{product.priceMode==='CONTACT' ? 'LIÊN HỆ' : product.priceMode==='FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>
          <div className="location-row">
            📍 {product.location || 'Quy Nhơn'}
          </div>
          {/* HIỂN THỊ TÊN NGƯỜI ĐĂNG VÀ NGÀY ĐĂNG TRÊN TỪNG DÒNG RIÊNG */}
          <div className="card-seller-name">
            👤 {product.sellerName}
          </div>
          <div className="card-posted-date">
            🕒 {new Date(product.postedAt).toLocaleDateString('vi-VN')}
          </div>
        </Link>

        <div className="card-footer-flex" style={{ marginTop: 8 }}>
          <span className="verified-badge">✓ Đã xác thực</span>
          <div style={{ position: 'relative' }}>
            <button
              className="card-more-btn"
              aria-label="Tùy chọn thêm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              ⋮
            </button>
            {/* NÚT 3 CHẤM MENU HIỂN THỊ BÊN DƯỚI KHÔNG CHE KHUẤT NỘI DUNG, CLICK NGOÀI TỰ TẮT */}
            {menuOpen && (
              <div className="card-menu-dropdown-bottom">
                <div onClick={(e) => { e.stopPropagation(); alert('Đã lưu tin!'); setMenuOpen(false); }}>Thích / Lưu tin</div>
                <div onClick={(e) => { e.stopPropagation(); alert('Đã ẩn tin này (Không quan tâm)'); setMenuOpen(false); }}>Không quan tâm</div>
                <div onClick={(e) => { e.stopPropagation(); alert('Sẽ không hiển thị tin tương tự'); setMenuOpen(false); }}>Không hiện nữa</div>
                <div onClick={(e) => { e.stopPropagation(); alert('Đã ghi nhận phản hồi vị trí'); setMenuOpen(false); }}>Xa chỗ tôi quá</div>
                <div onClick={(e) => { e.stopPropagation(); alert('Đã sao chép liên kết!'); setMenuOpen(false); }}>Chia sẻ</div>
                <div onClick={(e) => { e.stopPropagation(); alert('Đã gửi báo cáo vi phạm!'); setMenuOpen(false); }}>Báo cáo vi phạm</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MarketplaceHome({ query }: { query: string; group: string; sort: string; view: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Toàn quốc');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('Khám phá');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // DYNAMIC BANNERS STATE LOADED FROM ADMIN CONSOLE
  const [activeBanners, setActiveBanners] = useState<{ leftBanner?: string; rightBanner?: string; heroBanner?: string }>({
    leftBanner: '/assets/banner_right.png',
    rightBanner: '/assets/banner_right.png',
    heroBanner: '/assets/hero-dog-banner.png'
  });

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

  const provinces = [
    'Toàn quốc',
    'Vị trí gần bạn (GPS)',
    'Bình Định',
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Bình Dương',
    'Đồng Nai',
    'Khánh Hòa',
    'Quảng Nam',
    'Gia Lai',
    'Đắk Lắk'
  ];

  const searchSuggestions = [
    'iPhone 15 Pro Max',
    'Xe máy Honda Vision cũ',
    'Laptop Dell Core i7',
    'Nhà mặt tiền Quy Nhơn',
    'Tủ lạnh Inverter',
    'Việc làm bán thời gian'
  ].filter(s => searchQuery && s.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredProducts = products.filter(p => {
    if (selectedLocation === 'Toàn quốc' || selectedLocation.includes('Gần bạn')) return true;
    if (!p.location) return true;
    return p.location.toLowerCase().includes(selectedLocation.toLowerCase());
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

  const cats = [
    { name: 'Nhà đất', img: '/assets/property.png', slug: 'property' },
    { name: 'Xe cộ', img: '/assets/vehicles.png', slug: 'vehicles' },
    { name: 'Đồ công nghệ', img: '/assets/electronics.png', slug: 'electronics' },
    { name: 'Việc làm', img: '/assets/jobs.png', slug: 'jobs' },
    { name: 'Thực phẩm', img: '/assets/food.png', slug: 'food' },
    { name: 'Tặng miễn phí', img: '/assets/free.png', slug: 'free' },
    { name: 'Đồ gia dụng', img: '/assets/home-appliances.png', slug: 'home-appliances' },
    { name: 'Thời trang', img: '/assets/fashion.png', slug: 'fashion' },
    { name: 'Nhạc cụ', img: '/assets/instruments.png', slug: 'instruments' },
    { name: 'Thú cưng', img: '/assets/pets.png', slug: 'pets' },
    { name: 'Sách & học tập', img: '/assets/books.png', slug: 'books' },
    { name: 'Dịch vụ', img: '/assets/services.png', slug: 'services' },
    { name: 'Hàng hóa khác', img: '/assets/others.png', slug: 'others' },
    { name: 'Tất cả tin đăng', img: '/assets/logo.png', slug: 'all' },
  ];

  return (
    <main id="home">
      {/* BANNER QUẢNG CÁO TRƯỢT 2 BÊN MÉP (TỰ ĐỘNG ĐỒNG BỘ TỪ ADMIN CONSOLE) */}
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

      {/* HERO BANNER SÁT MÉP TRÊN (TỰ ĐỘNG ẨN KHI XÓA TRONG ADMIN) */}
      <section className="hero">
        <div className="shell">
          <div
            className="hero-banner-container"
            style={activeBanners.heroBanner ? { backgroundImage: `url(${activeBanners.heroBanner})` } : { backgroundImage: 'none' }}
          >
            <div className="hero-banner-bg" />
            <div className="hero-banner-overlay">
              <form className="search-box" onSubmit={handleSearch} style={{ position: 'relative' }}>
                <div className="search-input-group">
                  <Search color="#888" size={19} />
                  <input
                    type="text"
                    placeholder="Bạn đang tìm gì?"
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

                <div className="search-location-wrapper" style={{ position: 'relative' }}>
                  <div
                    className="search-location"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <MapPin size={17} /> {selectedLocation} ▾
                  </div>

                  {showLocationDropdown && (
                    <div className="location-dropdown-menu">
                      {provinces.map((prov) => (
                        <div
                          key={prov}
                          className={`location-dropdown-item ${selectedLocation === prov ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedLocation(prov);
                            setShowLocationDropdown(false);
                            if (prov === 'Vị trí gần bạn (GPS)') {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  () => setSelectedLocation('Vị trí gần bạn (GPS)'),
                                  () => alert('Không thể lấy vị trí GPS. Đã chuyển về mặc định.')
                                );
                              }
                            }
                          }}
                        >
                          <MapPin size={14} /> {prov}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="search-btn"><Search size={18} /> Tìm kiếm</button>

                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions-dropdown">
                    {searchSuggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          setSearchQuery(sug);
                          setShowSuggestions(false);
                          router.push('/?q=' + encodeURIComponent(sug));
                        }}
                      >
                        <Search size={14} color="#888" /> {sug}
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* TỪ KHÓA TÌM KIẾM PHỔ BIẾN NGAY DƯỚI FORM */}
              <div className="hero-quick-keywords">
                <span>Tìm kiếm phổ biến:</span>
                {[
                  { label: 'iPhone', q: 'iPhone' },
                  { label: 'Xe máy', q: 'Xe máy' },
                  { label: 'Máy ảnh', q: 'Máy ảnh' },
                  { label: 'Việc làm', q: 'Việc làm' },
                  { label: 'Nhà đất', q: 'Nhà đất' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item.q);
                      router.push('/?q=' + encodeURIComponent(item.q));
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DANH MỤC COMPACT */}
      <section className="categories-section">
        <div className="shell">
          <div className="white-card-box">
            <button type="button" className="nav-arrow left" onClick={() => scrollCategories('left')} aria-label="Cuộn sang trái">
              <ChevronLeft size={20} color="#555" />
            </button>
            <div className="category-scroll" ref={categoryScrollRef}>
              {cats.map((c, i) => (
                <Link href={`/categories?cat=${c.slug}`} key={i} className="cat-card-clean">
                  <div className="cat-icon-wrapper">
                    <img src={c.img} alt={c.name} />
                  </div>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
            <button type="button" className="nav-arrow right" onClick={() => scrollCategories('right')} aria-label="Cuộn sang phải">
              <ChevronRight size={20} color="#555" />
            </button>
          </div>
        </div>
      </section>

      {/* KHỐI TAB KHÁM PHÁ COMPACT */}
      <section className="shell tabbed-explore-section" style={{ marginBottom: 12 }}>
        <div className="white-card-box" style={{ padding: '12px 16px' }}>
          <div className="tabbed-header">
            {['Khám phá', 'Dành cho bạn', 'Gần bạn', 'Mới đăng', 'Giá tốt', 'Đã xác thực', 'Đồ công nghệ', 'Xe cộ', 'Nhà đất'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`explore-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'Gần bạn' ? '📍 ' : tab === 'Đã xác thực' ? '✓ ' : tab === 'Khám phá' ? '🔥 ' : ''}{tab}
              </button>
            ))}
          </div>
          <div className="explore-tab-content">
            <div className="products-grid-6">
              {filteredProducts.slice(0, 6).map(product => (
                <ProductCard key={'tab'+product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="shell main-grid">
        <div className="main-content" style={{display:'flex', flexDirection:'column', gap: 16, width: '100%'}}>
          <div className="white-card-box">
            <div className="section-title">
              <h2><Flame /> {query ? `Kết quả cho "${query}"` : 'Sản phẩm mới dành cho bạn'} {selectedLocation !== 'Toàn quốc' && <span style={{fontSize:13, fontWeight:500, color:'#00a65a'}}>({selectedLocation})</span>}</h2>
              <Link href="/categories" className="view-all">Xem tất cả →</Link>
            </div>

            <div className="products-grid-6">
              {isLoading ? (
                <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Đang tải sản phẩm...</p>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.slice(0, 12).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div style={{padding: 30, textAlign:'center', gridColumn: 'span 6', color: '#64748b'}}>
                  <p style={{fontSize:15, fontWeight:600, color:'#1e293b', marginBottom:6}}>Không tìm thấy sản phẩm phù hợp.</p>
                  <p style={{fontSize:13, marginBottom:12}}>Thử thay đổi từ khóa, khu vực hoặc bộ lọc của bạn.</p>
                  <button onClick={() => setSelectedLocation('Toàn quốc')} style={{background:'#00a65a', color:'#fff', border:'none', padding:'8px 18px', borderRadius:999, fontWeight:600, cursor:'pointer'}}>Đặt lại bộ lọc</button>
                </div>
              )}
            </div>
          </div>

          {!query && (
            <div className="white-card-box">
              <div className="section-title">
                <h2><MessageSquare /> Tin mới đăng</h2>
                <Link href="/categories" className="view-all">Xem tất cả →</Link>
              </div>
              <div className="products-grid-6">
                {isLoading ? (
                  <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Đang tải tin mới...</p>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.slice().reverse().slice(0, 6).map(product => (
                    <ProductCard key={'new'+product.id} product={product} />
                  ))
                ) : (
                  <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Chưa có tin mới đăng.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* KHỐI TỪ KHÓA TÌM KIẾM NHIỀU NHẤT */}
      <section className="shell" style={{ marginTop: 16, marginBottom: 24 }}>
        <div className="white-card-box">
          <div className="section-title" style={{ marginBottom: 12 }}>
            <h2><Search size={19} color="#00a65a" /> Từ khóa tìm kiếm nhiều nhất</h2>
          </div>
          <div className="popular-keywords-grid">
            {[
              { label: 'Xe máy giá rẻ', query: 'Xe máy' },
              { label: 'iPhone 15 Pro Max', query: 'iPhone 15' },
              { label: 'Nhà đất Bình Định', query: 'Nhà đất' },
              { label: 'Laptop văn phòng', query: 'Laptop' },
              { label: 'Tủ lạnh LG', query: 'Tủ lạnh' },
              { label: 'Chung cư giá rẻ', query: 'Chung cư' },
              { label: 'Máy giặt Toshiba', query: 'Máy giặt' },
              { label: 'Sofa phòng khách', query: 'Sofa' },
              { label: 'Mèo cảnh / Thú cưng', query: 'Thú cưng' },
              { label: 'Thời trang nam nữ', query: 'Thời trang' },
              { label: 'Tivi Samsung 4K', query: 'Tivi' },
              { label: 'Dịch vụ sửa chữa tại nhà', query: 'Dịch vụ' },
              { label: 'Xe Honda Wave Alpha', query: 'Wave' },
              { label: 'Điện thoại cũ giá rẻ', query: 'Điện thoại' },
              { label: 'Bàn ghế gỗ tự nhiên', query: 'Bàn ghế' },
              { label: 'Đồng hồ thông minh', query: 'Đồng hồ' },
            ].map((kw, i) => (
              <button
                key={i}
                type="button"
                className="popular-keyword-chip"
                onClick={() => router.push('/?q=' + encodeURIComponent(kw.query))}
              >
                {kw.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
