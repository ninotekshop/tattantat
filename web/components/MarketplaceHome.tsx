'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Product, type Category } from '../lib/api';

function formatVnd(val: string) {
  return parseInt(val || '0').toLocaleString('vi-VN') + 'đ';
}

function ProductCard({ product }: { product: Product }) {
  const [failedImage, setFailedImage] = useState(false);

  // Decide badge based on some logic (mocking based on status or time for demo)
  const isHot = product.status === 'PROMOTED';
  const isNew = !isHot && new Date(product.postedAt).getTime() > Date.now() - 86400000;
  const isSale = product.priceMode === 'CONTACT';

  return (
    <article className="product-card">
      <button className="heart">♡</button>
      {isHot && <span className="badge hot">Nổi bật</span>}
      {isNew && <span className="badge new">Mới</span>}
      {isSale && <span className="badge sale">Liên hệ</span>}

      <Link href={'/products/' + product.id} style={{textDecoration: 'none', color: 'inherit'}}>
        <img src={product.imageUrl && !failedImage ? product.imageUrl : '/assets/product-1.jpg'} alt={product.title} onError={() => setFailedImage(true)} />
        <div className="product-body">
          <h3>{product.title}</h3>
          <strong>{product.priceMode==='CONTACT'?'Liên hệ':product.priceMode==='FREE'?'Cho tặng miễn phí':formatVnd(product.price)}</strong>
          <small>⌖ {product.location || 'Chưa cập nhật'}</small>
          <div className="seller">{product.sellerName} <span>{new Date(product.postedAt).toLocaleDateString('vi-VN')}</span></div>
        </div>
      </Link>
    </article>
  );
}

export function MarketplaceHome({ query, group }: { query: string; group: string; sort: string; view: string }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [catData, prodData] = await Promise.all([
          api.categories().catch(() => []),
          api.products(query).catch(() => [])
        ]);
        if (!cancelled) {
          setCategories(catData);
          setProducts(prodData);
        }
      } catch (err) {
        // Handle error silently or show toast
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [query, group]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push('/?q=' + encodeURIComponent(searchQuery) + '#new');
  }

  // Fallback static categories if API empty
  const cats = categories.length ? categories.map(c => ({ name: c.name, img: '/assets/cat-tech.jpg' })) : [
    { name: 'Đồ công nghệ', img: '/assets/cat-tech.jpg' },
    { name: 'Xe cộ', img: '/assets/cat-car.jpg' },
    { name: 'Nhà đất', img: '/assets/cat-home.jpg' },
    { name: 'Đồ gia dụng', img: '/assets/cat-furniture.jpg' },
    { name: 'Thời trang', img: '/assets/cat-fashion.jpg' },
    { name: 'Thể thao', img: '/assets/cat-sport.jpg' },
    { name: 'Sách', img: '/assets/cat-books.jpg' },
    { name: 'Dịch vụ', img: '/assets/cat-service.jpg' },
  ];

  return (
    <main id="home">
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="shell hero-content">
          <div className="hero-copy">
            <div className="eyebrow">Tất Tần Tật Marketplace</div>
            <h1>Mua bán mọi thứ,<br/><strong>gần bạn!</strong></h1>
            <p>An toàn · Nhanh chóng · Kết nối dễ dàng</p>
          </div>
          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-row">
              <span className="search-icon">⌕</span>
              <input id="searchInput" type="search" placeholder="Tìm sản phẩm, dịch vụ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoComplete="off" />
              <button type="button" className="location">⌖ Toàn quốc ▾</button>
              <button type="submit" className="search-btn" id="searchBtn">Tìm kiếm</button>
            </div>
            <div className="quick-searches">
              <button type="button" onClick={() => router.push('/?q=iPhone#new')}>iPhone</button>
              <button type="button" onClick={() => router.push('/?q=Xe máy#new')}>Xe máy</button>
              <button type="button" onClick={() => router.push('/?q=Nhà đất#new')}>Nhà đất</button>
              <button type="button" onClick={() => router.push('/?q=Laptop#new')}>Laptop</button>
              <button type="button" onClick={() => router.push('/?q=Sofa#new')}>Sofa</button>
              <button type="button" onClick={() => router.push('/?q=Dịch vụ#new')}>Dịch vụ sửa chữa</button>
            </div>
          </form>
        </div>
      </section>

      <section className="shell category-strip" id="categories">
        <div className="section-head compact">
          <h2>Danh mục</h2>
          <div className="arrows"><button>‹</button><button>›</button></div>
        </div>
        <div className="category-grid">
          {cats.map((c, i) => (
            <Link href={'/categories'} key={i} className="category-card">
              <img src={c.img} alt={c.name} /><span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell content-layout">
        <div className="products-column">
          <div className="section-head" id="new">
            <div><span className="section-kicker">Mua bán nổi bật</span><h2>{query ? `Kết quả cho "${query}"` : 'Sản phẩm nổi bật'}</h2></div>
            <Link href="/categories">Xem tất cả →</Link>
          </div>
          <div className="product-grid" id="productGrid">
            {products.length > 0 ? products.map(product => (
              <ProductCard key={product.id} product={product} />
            )) : (
              <p style={{padding: 20, color: '#666'}}>Đang tải sản phẩm hoặc không tìm thấy kết quả...</p>
            )}
          </div>

          {!query && (
            <>
              <div className="section-head" id="selling" style={{marginTop: 40}}>
                <div><span className="section-kicker">Mới nhất</span><h2>Tin mới đăng</h2></div>
                <Link href="/categories">Xem tất cả →</Link>
              </div>
              <div className="mini-list">
                {products.slice(0, 4).map(product => (
                  <div key={'mini'+product.id}>
                    <span>Mới</span> <Link href={'/products/'+product.id}>{product.title}</Link> <b>{formatVnd(product.price)}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="right-rail">
          <div className="ad-card green-ad">
            <div><small>Đăng tin miễn phí</small><h3>Bán nhanh<br/>chốt dễ dàng</h3><Link href="/sell" style={{textDecoration:'none'}}><button>Đăng tin ngay →</button></Link></div>
            <div className="ad-symbol">＋</div>
          </div>
          <div className="ad-card yellow-ad">
            <div><small>Mua bán xe cộ</small><h3>Uy tín · An toàn</h3><Link href="/categories" style={{textDecoration:'none'}}><button>Xem ngay →</button></Link></div>
          </div>
          <div className="ad-card dark-ad">
            <div><small>Đồ công nghệ</small><h3>Chính hãng · Giá tốt</h3><Link href="/categories" style={{textDecoration:'none'}}><button>Khám phá →</button></Link></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
