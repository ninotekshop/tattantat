'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight, ArrowRightCircle, MessageSquare } from 'lucide-react';
import { api, type Product } from '../lib/api';

function formatVnd(val: string) {
  return parseInt(val || '0').toLocaleString('vi-VN') + 'đ';
}

function ProductCard({ product }: { product: Product }) {
  const [failedImage, setFailedImage] = useState(false);

  const isHot = product.status === 'PROMOTED';
  const isSale = product.priceMode === 'CONTACT';
  const isNew = !isHot && !isSale && new Date(product.postedAt).getTime() > Date.now() - 86400000;

  return (
    <article className="product-card">
      <div className="card-img">
        <div className="badges">
          {isHot && <span className="badge hot">Nổi bật</span>}
          {isSale && <span className="badge sale">Giảm giá</span>}
          {isNew && <span className="badge new">Mới</span>}
        </div>
        <button className="heart-btn" aria-label="Yêu thích"><HeartIcon /></button>
        <Link href={'/products/' + product.id}>
          <img src={product.imageUrl && !failedImage ? product.imageUrl : '/assets/product-1.jpg'} alt={product.title} onError={() => setFailedImage(true)} />
        </Link>
      </div>
      <div className="card-body">
        <Link href={'/products/' + product.id} style={{textDecoration:'none', color:'inherit'}}>
          <h3>{product.title}</h3>
          <div className="price-row">
            <span className="price">{product.priceMode==='CONTACT' ? 'Liên hệ' : product.priceMode==='FREE' ? 'Miễn phí' : formatVnd(product.price)}</span>
            {product.priceMode !== 'CONTACT' && product.priceMode !== 'FREE' && <span className="nego">Có thể thương lượng</span>}
          </div>
          <div className="location-row">
            <MapPin size={13} /> {product.location || 'Quy Nhơn'} · <span className="verified-badge">✓ Đã xác thực</span>
          </div>
          <div className="seller-row">
            <div className="seller-info">
              <span>{product.sellerName}</span>
            </div>
            <span>{new Date(product.postedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </Link>
      </div>
    </article>
  );
}

function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}

export function MarketplaceHome({ query }: { query: string; group: string; sort: string; view: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Đang định vị (Gần bạn)');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('Khám phá');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setSelectedLocation('Vị trí gần bạn (GPS)'),
        () => setSelectedLocation('Bình Định'),
        { timeout: 6000 }
      );
    } else {
      setSelectedLocation('Bình Định');
    }
  }, []);

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
    router.push('/?q=' + encodeURIComponent(searchQuery));
  }

  const cats = [
    { name: 'Nhà đất', img: '/assets/03-nha-dat.png', slug: 'property' },
    { name: 'Xe cộ', img: '/assets/02-xe-co.png', slug: 'vehicles' },
    { name: 'Đồ công nghệ', img: '/assets/01-do-cong-nghe.png', slug: 'electronics' },
    { name: 'Việc làm', img: '/assets/12-dich-vu.png', slug: 'jobs' },
    { name: 'Thực phẩm', img: '/assets/04-do-gia-dung.png', slug: 'food' },
    { name: 'Tặng miễn phí', img: '/assets/09-do-suu-tam.png', slug: 'free' },
    { name: 'Đồ gia dụng', img: '/assets/04-do-gia-dung.png', slug: 'home-appliances' },
    { name: 'Thời trang', img: '/assets/05-thoi-trang.png', slug: 'fashion' },
    { name: 'Nhạc cụ', img: '/assets/06-the-thao-giai-tri.png', slug: 'instruments' },
    { name: 'Thú cưng', img: '/assets/10-thu-cung.png', slug: 'pets' },
    { name: 'Sách & học tập', img: '/assets/07-sach-hoc-tap.png', slug: 'books' },
    { name: 'Dịch vụ', img: '/assets/12-dich-vu.png', slug: 'services' },
    { name: 'Hàng hóa khác', img: '/assets/11-hang-hoa-khac.png', slug: 'others' },
    { name: 'Tất cả tin đăng', img: '/assets/logo.png', slug: 'all' },
  ];

  return (
    <main id="home">
      <section className="hero">
        <div className="shell">
          <div className="hero-banner-container">
            <div className="hero-banner-bg" />
            <div className="hero-banner-overlay">
              <form className="search-box" onSubmit={handleSearch}>
                <div className="search-input-group">
                  <Search color="#888" size={19} />
                  <input type="text" placeholder="Tìm trên Tất Tần Tật..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* VÙNG MÀU TRẮNG BO TRÒN 4 GÓC BAO BỌC LOGO DANH MỤC */}
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

      {/* MENU DƯỚI FORM TÌM KIẾM THIẾT KẾ LẠI DẠNG KHỐI TAB LỰA CHỌN */}
      <section className="shell tabbed-explore-section" style={{ marginBottom: 20 }}>
        <div className="white-card-box" style={{ padding: '16px 24px' }}>
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

      {/* BỌC NỘI DUNG VÀ KHỐI BÊN DƯỚI TRONG KHUNG TRẮNG BO TRÒN */}
      <section className="shell main-grid">
        <div className="main-content" style={{display:'flex', flexDirection:'column', gap: 24}}>
          {/* KHỐI SẢN PHẨM NỔI BẬT */}
          <div className="white-card-box">
            <div className="section-title">
              <h2><Flame /> {query ? `Kết quả cho "${query}"` : 'Sản phẩm nổi bật'} {selectedLocation !== 'Toàn quốc' && <span style={{fontSize:13, fontWeight:500, color:'#00a65a'}}>({selectedLocation})</span>}</h2>
              <Link href="/categories" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
            </div>

            <div className="products-grid-6">
              {isLoading ? (
                <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Đang tải sản phẩm...</p>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.slice(0, 12).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Chưa có dữ liệu hoặc không tìm thấy sản phẩm nào tại khu vực này.</p>
              )}
            </div>
          </div>

          {/* KHỐI TIN MỚI ĐĂNG */}
          {!query && (
            <div className="white-card-box">
              <div className="section-title">
                <h2><MessageSquare /> Tin mới đăng</h2>
                <Link href="/categories" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
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

        <aside className="sidebar" style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sidebar-banner-card" style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <Link href="/sell">
              <img src="/assets/banner_right.png" alt="Đăng tin miễn phí - Mua bán nhanh chóng" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 16 }} />
            </Link>
          </div>
        </aside>
      </section>

      {/* KHỐI TỪ KHÓA TÌM KIẾM NHIỀU NHẤT (TƯƠNG TỰ CHỢ TỐT) */}
      <section className="shell" style={{ marginTop: 20, marginBottom: 32 }}>
        <div className="white-card-box">
          <div className="section-title" style={{ marginBottom: 16 }}>
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
