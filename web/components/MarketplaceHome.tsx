'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Zap, Users, Search, MapPin, ChevronLeft, ChevronRight, Flame, ArrowRight, ArrowRightCircle } from 'lucide-react';
import { api, type Product, type Category } from '../lib/api';

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
            <MapPin size={14} /> {product.location || 'Chưa cập nhật'}
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
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}

export function MarketplaceHome({ query }: { query: string; group: string; sort: string; view: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const prodData = await api.products(query).catch(() => []);
        if (!cancelled) setProducts(prodData);
      } catch (err) {}
    }
    void load();
    return () => { cancelled = true; };
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push('/?q=' + encodeURIComponent(searchQuery));
  }

  const cats = [
    { name: 'Đồ công nghệ', img: '/assets/cat-tech.jpg' },
    { name: 'Xe cộ', img: '/assets/cat-car.jpg' },
    { name: 'Nhà đất', img: '/assets/cat-home.jpg' },
    { name: 'Đồ gia dụng', img: '/assets/cat-furniture.jpg' },
    { name: 'Thời trang', img: '/assets/cat-fashion.jpg' },
    { name: 'Thể thao & giải trí', img: '/assets/cat-sport.jpg' },
    { name: 'Sách & học tập', img: '/assets/cat-books.jpg' },
    { name: 'Máy móc & công cụ', img: '/assets/cat-tools.jpg' },
    { name: 'Đồ sưu tầm', img: '/assets/cat-collect.jpg' },
    { name: 'Thú cưng', img: '/assets/cat-pets.jpg' },
    { name: 'Hàng hóa khác', img: '/assets/cat-other.jpg' },
    { name: 'Dịch vụ', img: '/assets/cat-service.jpg' },
  ];

  return (
    <main id="home">
      <section className="hero">
        <div className="hero-bg" style={{backgroundImage: "url('/assets/hero.jpg')"}}></div>
        <div className="shell hero-content">
          <h1>Mua bán mọi thứ,<br/><strong>gần bạn! <HeartIcon /></strong></h1>
          <div className="hero-features">
            <div className="feature-pill"><ShieldCheck color="#00985f" /> An toàn</div>
            <div className="feature-pill"><Zap color="#00985f" /> Nhanh chóng</div>
            <div className="feature-pill"><Users color="#00985f" /> Kết nối dễ dàng</div>
          </div>

          <form className="search-box" onSubmit={handleSearch}>
            <div className="search-input-group">
              <Search color="#999" size={20} />
              <input type="text" placeholder="Tìm kiếm sản phẩm, dịch vụ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="search-divider"></div>
            <div className="search-location">
              <MapPin size={18} /> Bình Định (Gia Lai mới) ▾
            </div>
            <button type="submit" className="search-btn"><Search size={18} /> Tìm kiếm</button>
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
      </section>

      <section className="categories-section">
        <div className="shell" style={{position:'relative'}}>
          <button className="nav-arrow left"><ChevronLeft size={24} color="#666" /></button>
          <div className="category-scroll">
            {cats.map((c, i) => (
              <Link href={'/categories'} key={i} className="cat-card">
                <img src={c.img} alt={c.name} /><span>{c.name}</span>
              </Link>
            ))}
          </div>
          <button className="nav-arrow right"><ChevronRight size={24} color="#666" /></button>
        </div>
      </section>

      <section className="shell main-grid">
        <div className="main-content">
          <div className="section-title">
            <h2><Flame /> {query ? `Kết quả cho "${query}"` : 'Sản phẩm nổi bật'}</h2>
            <Link href="/categories" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
          </div>
          <div className="products-grid">
            {products.length > 0 ? products.map(product => (
              <ProductCard key={product.id} product={product} />
            )) : (
              <p style={{padding: 20, color: '#666', gridColumn: 'span 4'}}>Không tìm thấy sản phẩm nào.</p>
            )}
          </div>

          {!query && (
            <>
              <div className="section-title" style={{marginTop: 40}}>
                <h2><MessageSquare /> Tin mới đăng</h2>
                <Link href="/categories" className="view-all">Xem tất cả <ArrowRight size={16} /></Link>
              </div>
              <div className="products-grid">
                {products.slice().reverse().slice(0, 4).map(product => (
                  <ProductCard key={'new'+product.id} product={product} />
                ))}
              </div>
            </>
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
