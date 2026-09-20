'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
        <button className="heart-btn"><HeartIcon /></button>
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
            <MapPin size={13} /> {product.location || 'Chưa cập nhật'}
          </div>
          <div className="seller-row">
            <div className="seller-info">
              <div className="seller-avatar" />
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push('/?q=' + encodeURIComponent(searchQuery));
  }

  const cats = [
    { name: 'Đồ công nghệ', img: '/assets/01-do-cong-nghe.png', slug: 'electronics' },
    { name: 'Xe cộ', img: '/assets/02-xe-co.png', slug: 'vehicles' },
    { name: 'Nhà đất', img: '/assets/03-nha-dat.png', slug: 'property' },
    { name: 'Đồ gia dụng', img: '/assets/04-do-gia-dung.png', slug: 'home-appliances' },
    { name: 'Thời trang', img: '/assets/05-thoi-trang.png', slug: 'fashion' },
    { name: 'Thể thao & giải trí', img: '/assets/06-the-thao-giai-tri.png', slug: 'sports' },
    { name: 'Sách & học tập', img: '/assets/07-sach-hoc-tap.png', slug: 'books' },
    { name: 'Máy móc & công cụ', img: '/assets/08-may-moc-cong-cu.png', slug: 'tools' },
    { name: 'Đồ sưu tầm', img: '/assets/09-do-suu-tam.png', slug: 'collectibles' },
    { name: 'Thú cưng', img: '/assets/10-thu-cung.png', slug: 'pets' },
    { name: 'Hàng hóa khác', img: '/assets/11-hang-hoa-khac.png', slug: 'others' },
    { name: 'Dịch vụ', img: '/assets/12-dich-vu.png', slug: 'services' },
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
                  <input type="text" placeholder="Tìm kiếm sản phẩm, dịch vụ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="search-divider"></div>
                <div className="search-location">
                  <MapPin size={17} /> Bình Định (Gia Lai mới) ▾
                </div>
                <button type="submit" className="search-btn"><Search size={17} /> Tìm kiếm</button>
              </form>

              <div className="quick-tags">
                <button type="button" onClick={() => router.push('/?q=iPhone')}>iPhone 15</button>
                <button type="button" onClick={() => router.push('/?q=Xe máy')}>Xe máy</button>
                <button type="button" onClick={() => router.push('/?q=Nhà đất')}>Nhà đất</button>
                <button type="button" onClick={() => router.push('/?q=Laptop')}>Laptop</button>
                <button type="button" onClick={() => router.push('/?q=Sofa')}>Sofa</button>
                <button type="button" onClick={() => router.push('/?q=Máy ảnh')}>Máy ảnh</button>
                <button type="button" onClick={() => router.push('/?q=Dịch vụ')}>Dịch vụ sửa chữa</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VÙNG MÀU TRẮNG BO TRÒN 4 GÓC BAO BỌC LOGO DANH MỤC */}
      <section className="categories-section">
        <div className="shell">
          <div className="white-card-box">
            <div className="section-title" style={{marginBottom: 16}}>
              <h2>Danh mục sản phẩm</h2>
            </div>
            <div style={{position:'relative'}}>
              <button className="nav-arrow left"><ChevronLeft size={24} color="#555" /></button>
              <div className="category-scroll">
                {cats.map((c, i) => (
                  <Link href={'/categories'} key={i} className="cat-card-clean">
                    <div className="cat-icon-wrapper">
                      <img src={c.img} alt={c.name} />
                    </div>
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
              <button className="nav-arrow right"><ChevronRight size={24} color="#555" /></button>
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
              <h2><Flame /> {query ? `Kết quả cho "${query}"` : 'Sản phẩm nổi bật'}</h2>
              <Link href="/categories" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
            </div>

            <div className="products-grid-6">
              {isLoading ? (
                <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Đang tải sản phẩm...</p>
              ) : products.length > 0 ? (
                products.slice(0, 12).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Chưa có dữ liệu hoặc không tìm thấy sản phẩm nào.</p>
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
                ) : products.length > 0 ? (
                  products.slice().reverse().slice(0, 6).map(product => (
                    <ProductCard key={'new'+product.id} product={product} />
                  ))
                ) : (
                  <p style={{padding: 20, color: '#666', gridColumn: 'span 6'}}>Chưa có tin mới đăng.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="sidebar">
          <div className="ad-card ad-post">
            <div className="ad-content">
              <h3>Đăng tin miễn phí</h3>
              <p>Nhanh chóng - Hiệu quả</p>
              <Link href="/sell" style={{textDecoration:'none'}}><button className="ad-btn">Đăng tin ngay <ArrowRightCircle size={14}/></button></Link>
            </div>
          </div>

          <div className="ad-card ad-vehicle">
            <div className="ad-content">
              <h3>Mua bán xe cộ</h3>
              <p>Uy tín - An toàn</p>
              <Link href="/categories" style={{textDecoration:'none'}}><button className="ad-btn">Xem ngay <ArrowRightCircle size={14}/></button></Link>
            </div>
          </div>

          <div className="ad-card ad-tech">
            <div className="ad-content">
              <h3>Đồ công nghệ</h3>
              <p>Chính hãng - Giá tốt</p>
              <Link href="/categories" style={{textDecoration:'none'}}><button className="ad-btn">Khám phá <ArrowRightCircle size={14}/></button></Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
