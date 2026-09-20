'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, CarFront, ChevronRight, Gamepad2, House, ImageOff,
  MapPin, Monitor, MoreHorizontal, PackagePlus, SearchX, ShieldCheck,
  Shirt, ShoppingBag, Smartphone, Sofa, Store, UserRound, Wrench, Headphones,
} from 'lucide-react';
import { api, type Product } from '../lib/api';
import { categoryGroups, categoryHref, formatVnd, resolveCategoryIds, shoppingGuides } from '../lib/marketplace';
import { InfoDialog, StoreBadges } from './InfoDialog';

const icons = { phone: Smartphone, monitor: Monitor, shirt: Shirt, car: CarFront, house: House, tools: Wrench, sofa: Sofa, game: Gamepad2, book: BookOpen, more: MoreHorizontal };
const heroSlides = [
  { title: 'Tất Tần Tật', subtitle: 'Mua bán mọi thứ, gần bạn', description: 'Từ đồ cũ, đồ mới đến bất động sản, xe cộ, dịch vụ…', action: 'Khám phá ngay', href: '#products' },
  { title: 'Đồ cũ, giá trị mới', subtitle: 'Món đồ nhỏ, niềm vui lớn', description: 'Tìm món đồ bạn cần, kết nối với người bán gần bạn.', action: 'Xem tin đăng', href: '#products' },
  { title: 'Đăng tin miễn phí', subtitle: 'Thêm một hành trình mới', description: 'Chia sẻ món đồ không còn dùng đến với cộng đồng.', action: 'Đăng tin ngay', href: '/sell' },
  { title: 'Khám phá mỗi ngày', subtitle: 'Cả thế giới mua bán gần bạn', description: 'Điện thoại, xe cộ, nội thất và nhiều hơn thế nữa.', action: 'Xem danh mục', href: '/categories' },
];

function ProductCard({ product }: { product: Product }) {
  const [failedImage, setFailedImage] = useState(false);
  return <article className="product-card">
    <Link href={'/products/' + product.id} className="product-link">
      <div className="product-img">{product.imageUrl && !failedImage
        ? <img src={product.imageUrl} alt={product.title} loading="lazy" onError={() => setFailedImage(true)} />
        : <span className="image-placeholder"><ImageOff size={28} />Chưa có ảnh</span>}
      </div>
      <div className="product-info">
        <h3>{product.title}</h3><p className="price">{product.priceMode==='CONTACT'?'Liên hệ':product.priceMode==='FREE'?'Cho tặng miễn phí':formatVnd(product.price)+({HOUR:'/giờ',DAY:'/ngày',MONTH:'/tháng',M2:'/m²'}[product.priceMode??'']??'')}</p>
        <p className="location"><MapPin size={13} /><span>{product.location || 'Chưa cập nhật vị trí'}</span></p>
        <p className="product-seller"><UserRound size={13} /><span>{product.sellerName}</span></p>
      </div>
    </Link>
  </article>;
}

export function MarketplaceHome({ query, group, sort, view }: { query: string; group: string; sort: string; view: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const selectedGroup = categoryGroups.find(item => item.key === group);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setExpanded(false);
      try {
        const selected = categoryGroups.find(item => item.key === group);
        const categories = selected ? await api.categories() : [];
        // Grouped design categories can span several backend categories.
        const categoryIds = resolveCategoryIds(group, categories);
        const results = selected
          ? categoryIds.length ? (await Promise.all(categoryIds.map(id => api.products(query, id)))).flat() : []
          : await api.products(query);
        const unique = [...new Map(results.map(product => [product.id, product])).values()];
        if (sort === 'newest') unique.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
        if (!cancelled) setProducts(unique);
      } catch (cause) {
        if (!cancelled) { setProducts([]); setError(cause instanceof Error ? cause.message : 'Không thể tải tin đăng'); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [query, group, sort, retry]);

  const hero = heroSlides[slide];
  const filtered = Boolean(query || group || sort || view);
  const visibleProducts = expanded || filtered ? products : products.slice(0, 4);
  const sellers = [...new Map(products.map(product => [product.sellerId, product])).values()];
  const sectionTitle = view === 'shops' ? 'Người bán trên Tất Tần Tật' : query ? 'Kết quả cho “' + query + '”' : selectedGroup?.label ?? (sort === 'newest' ? 'Tin đăng mới nhất' : 'Sản phẩm nổi bật');

  return <main className="container marketplace-home" id="main-content">
    <div className="home-layout">
      <aside className="left-sidebar" aria-label="Danh mục và khám phá">
        <nav className="menu-list" aria-label="Danh mục sản phẩm">
          {categoryGroups.map(category => {
            const Icon = icons[category.icon];
            return <Link key={category.key} href={categoryHref(category.key)} className={'menu-item' + (group === category.key ? ' selected' : '')} aria-current={group === category.key ? 'true' : undefined}>
              <Icon size={20} strokeWidth={1.7} /><span>{category.label}</span><ChevronRight size={14} />
            </Link>;
          })}
        </nav>
        <section className="ad-stack" id="discover"><h2>Gợi ý dành cho bạn</h2>
          <Link href="/?q=iPhone#products" className="ad-tile art-phone"><strong>iPhone cũ<br />Giá tốt</strong><span>Khám phá ngay hôm nay</span><b>Xem ngay <ArrowRight size={12} /></b></Link>
          <Link href={categoryHref('technology')} className="ad-tile art-laptop"><strong>Laptop sinh viên<br /><em>Học tập, làm việc</em></strong><b>Xem ngay <ArrowRight size={12} /></b></Link>
          <Link href={categoryHref('property')} className="ad-tile art-house"><strong>Nhà đất gần bạn</strong><span>Tìm nơi an cư lý tưởng</span><b>Xem ngay <ArrowRight size={12} /></b></Link>
          <Link href={categoryHref('vehicles')} className="ad-tile art-scooter"><strong>Xe máy cũ</strong><span>Nhiều lựa chọn dành cho bạn</span><b>Xem ngay <ArrowRight size={12} /></b></Link>
        </section>
      </aside>

      <div className="main-content">
        <section className="hero-banner" aria-label="Khám phá Tất Tần Tật">
          <img className="hero-art" src="/images/marketplace-hero.png" alt="" fetchPriority="high" />
          <div className="hero-content" aria-live="polite">
            <h1 className={slide ? 'alternate-title' : ''}>{hero.title}</h1><h2>{hero.subtitle}</h2>
            <p>{hero.description}<br />Tất cả đều có tại Tất Tần Tật!</p>
            <Link className="hero-btn" href={hero.href}>{hero.action}<ArrowRight size={17} /></Link>
          </div>
          <div className="hero-dots" aria-label="Chọn banner">{heroSlides.map((item, index) => <button key={item.title} type="button" aria-label={'Banner ' + (index + 1) + ': ' + item.title} aria-pressed={slide === index} onClick={() => setSlide(index)} />)}</div>
        </section>
        <nav className="category-circles" aria-label="Khám phá nhanh">
          {categoryGroups.slice(0, 8).map(category => {
            const Icon = icons[category.icon];
            return <Link key={category.key} href={categoryHref(category.key)} className={'cat-circle ' + category.tone + (group === category.key ? ' active' : '')}><span className="cat-icon-bg"><Icon size={31} strokeWidth={1.8} /></span><span>{category.short}</span></Link>;
          })}
        </nav>
        <section id="products" aria-labelledby="products-heading" className="product-section">
          <div className="section-header"><h2 id="products-heading">{sectionTitle}</h2>
            {filtered ? <Link className="see-all" href="/#products">Bỏ bộ lọc <ArrowRight size={14} /></Link> : <button type="button" className="see-all" onClick={() => setExpanded(value => !value)}>{expanded ? 'Thu gọn' : 'Xem tất cả'}<ArrowRight size={14} /></button>}
          </div>
          {loading ? <div className="products-grid" aria-label="Đang tải sản phẩm" role="status">{[0, 1, 2, 3].map(i => <div className="product-skeleton" key={i}><div /><span /><span /><span /></div>)}</div>
          : error ? <div className="empty-state" role="alert"><SearchX size={30} /><h3>Chưa thể tải sản phẩm</h3><p>{error}</p><button type="button" className="hero-btn" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>
          : !products.length ? <div className="empty-state" role="status"><SearchX size={32} /><h3>Chưa có tin đăng phù hợp</h3><p>Thử tìm bằng từ khóa khác hoặc khám phá các danh mục khác nhé.</p><Link className="hero-btn" href="/#products">Xem tất cả tin đăng</Link></div>
          : view === 'shops' ? <div className="shops-grid">{sellers.map(seller => <article className="seller-card" key={seller.sellerId}><Store size={30} /><h3>{seller.sellerName}</h3><p>{products.filter(item => item.sellerId === seller.sellerId).length} tin đăng đang hiển thị</p><Link href={'/products/' + seller.id}>Xem sản phẩm <ArrowRight size={14} /></Link></article>)}</div>
          : <div className="products-grid">{visibleProducts.map(product => <ProductCard product={product} key={product.id} />)}
              {!filtered && products.length < 4 && <Link href="/sell" className="post-invite"><span><PackagePlus size={28} /></span><h3>Món đồ tiếp theo<br />là của bạn?</h3><p>Đăng tin miễn phí,<br />kết nối người mua.</p><b>Đăng tin ngay <ArrowRight size={14} /></b></Link>}
            </div>}
        </section>
        <section className="long-banners" aria-label="Khám phá thêm">
          <Link href={categoryHref('property')} className="long-banner property-banner"><div className="banner-art art-house" /><div><h3>Bất động sản</h3><p>Nhà đất · Căn hộ · Mặt bằng</p><span>Xem ngay <ArrowRight size={13} /></span></div></Link>
          <Link href={categoryHref('vehicles')} className="long-banner vehicle-banner"><div className="banner-art art-car" /><div><h3>Xe cộ</h3><p>Ô tô · Xe máy · Xe đạp</p><span>Xem ngay <ArrowRight size={13} /></span></div></Link>
          <Link href={categoryHref('services')} className="long-banner service-banner"><div className="banner-art art-service" /><div><h3>Dịch vụ</h3><p>Sửa chữa · Thiết kế · Vận chuyển</p><span>Xem ngay <ArrowRight size={13} /></span></div></Link>
        </section>
      </div>

      <aside className="right-sidebar" aria-label="Thông tin hữu ích">
        <section className="feature-box" aria-label="Lợi ích khi sử dụng">
          <div className="feature-item"><span className="feature-icon"><ShoppingBag size={24} /></span><div><h2>Đăng tin miễn phí</h2><p>Nhanh chóng, dễ dàng</p></div></div>
          <div className="feature-item"><span className="feature-icon"><ShieldCheck size={25} /></span><div><h2>Giao dịch an toàn</h2><p>Chủ động kiểm tra, an tâm mua bán</p></div></div>
          <div className="feature-item"><span className="feature-icon"><Headphones size={25} /></span><div><h2>Luôn sẵn sàng hỗ trợ</h2><p>Đồng hành cùng cộng đồng</p></div></div>
        </section>
        <section className="app-promo-box"><div className="app-promo-copy"><h2>Tải ứng dụng<br />Tất Tần Tật</h2><p>Mua bán mọi lúc,<br />mọi nơi!</p><StoreBadges /></div>
          <div className="phone-preview" aria-hidden="true"><div className="phone-camera" /><img src="/TatTanTat_logo_horizontal.svg" alt="" /><div className="mini-search" /><div className="mini-hero" /><div className="mini-categories"><i /><i /><i /><i /></div><div className="mini-products">{['phone', 'laptop', 'scooter', 'house'].map(art => <div className={'art-' + art} key={art} />)}</div></div>
        </section>
        <section className="news-box" id="news"><div className="section-header"><h2>Tin tức & Mẹo vặt</h2><InfoDialog className="see-all" title="Mẹo mua bán" trigger={<>Xem tất cả <ArrowRight size={11} /></>}><div className="guide-list">{shoppingGuides.map(guide => <section key={guide.title}><h3>{guide.title}</h3><p>{guide.body}</p></section>)}</div></InfoDialog></div>
          {shoppingGuides.map(guide => <InfoDialog key={guide.title} className="news-item" title={guide.title} trigger={<><span className={'news-img art-' + guide.art} /><span className="news-text"><strong>{guide.title}</strong><small>Mẹo mua bán hữu ích</small></span></>}><p className="eyebrow">{guide.category}</p><p>{guide.body}</p></InfoDialog>)}
        </section>
      </aside>
    </div>
  </main>;
}
