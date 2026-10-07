'use client';

import { Ic } from '../../components/Ic';
import { SellerAvatar } from '../../components/SellerAvatar';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Flame, Filter, MapPin as MapPinIcon, BadgeCheck, Heart } from 'lucide-react';
import { api, type Product } from '../../lib/api';
import { VideoBadge } from '../../components/VideoBadge';
import { formatVnd, CATEGORY_ENGINE_TAXONOMY, LISTING_INTENTS, ParentCategorySpec, SubCategorySpec } from '../../lib/marketplace';

/** Hàng cuộn ngang có nút mũi tên trái/phải để duyệt danh mục (ẩn khi đã ở đầu/cuối). */
function ScrollRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update();
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(update); ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [update, children]);
  // Đưa danh mục đang chọn vào vùng nhìn thấy khi mở trang.
  useEffect(() => {
    const el = ref.current; const active = el?.querySelector<HTMLElement>('[data-active="true"]');
    if (el && active) el.scrollLeft = Math.max(0, active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2);
    update();
  }, [update]);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * Math.max(240, (ref.current?.clientWidth ?? 600) * 0.75), behavior: 'smooth' });
  const arrow = (dir: 1 | -1, visible: boolean): React.CSSProperties => ({
    position: 'absolute', top: '50%', [dir === 1 ? 'right' : 'left']: -6, transform: 'translateY(-60%)', width: 34, height: 34, borderRadius: '50%',
    border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', display: visible ? 'grid' : 'none', placeItems: 'center', cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(15,23,42,.18)', zIndex: 2, padding: 0,
  });
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" aria-label="Xem danh mục phía trước" onClick={() => go(-1)} style={arrow(-1, edge.left)}><ChevronLeft size={20} /></button>
      <div ref={ref} onScroll={update} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>{children}</div>
      <button type="button" aria-label="Xem danh mục tiếp theo" onClick={() => go(1)} style={arrow(1, edge.right)}><ChevronRight size={20} /></button>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <article className="product-card">
      <div className="card-img">
        <button
          className={`heart-btn ${isFavorite ? 'active' : ''}`}
          aria-label="Yêu thích"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
        >
          <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>

        <Link href={'/products/' + product.id}>
          <img
            src={product.imageUrl || '/assets/product-1.jpg'}
            alt={product.title}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/product-1.jpg';
            }}
          />
        </Link>
        <VideoBadge show={product.hasVideo} />
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{textDecoration:'none', color:'inherit'}}>
          <h3 className="card-title-full">{product.title}</h3>
          <div className="price-row">
            <span className="price">{product.priceMode==='CONTACT' ? 'LIÊN HỆ' : product.priceMode==='FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>
          <div className="location-row" style={{display:'flex', alignItems:'center', gap:4, color:'#64748b'}}>
            <MapPinIcon size={13} /> {product.location || 'Quy Nhơn'}
          </div>
          <div className="card-seller-name" style={{fontSize:12, color:'#475569', marginTop:2, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2}}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflowWrap: 'anywhere' }}><SellerAvatar name={product.sellerName} url={product.sellerAvatar} /><span style={{ minWidth: 0 }}>{product.sellerName}</span></span>
            {product.sellerVerified && <span className="verified-badge" style={{ alignSelf: 'flex-start' }}><Ic i={BadgeCheck}/>Đã xác thực</span>}
          </div>
        </Link>
      </div>
    </article>
  );
}

function SubCategoryButton({ sub, parentIcon, parentKey, selectedSubSlug, selectedIntent }: { sub: SubCategorySpec; parentIcon: string; parentKey: string; selectedSubSlug: string | null; selectedIntent: string }) {
  return (
    <Link
      href={`/categories?cat=${parentKey}&sub=${sub.slug}&intent=${selectedIntent}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: selectedSubSlug === sub.slug ? '#e0f6e9' : '#f8fafc',
        border: selectedSubSlug === sub.slug ? '2px solid #00a65a' : '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '12px 16px',
        textDecoration: 'none',
        textAlign: 'left',
        transition: 'all 0.2s ease'
      }}
    >
      <img
        src={sub.icon}
        alt={sub.name}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = parentIcon; }
        }}
        style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))' }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: selectedSubSlug === sub.slug ? '#008247' : '#1e293b' }}>
        {sub.name}
      </span>
    </Link>
  );
}

function CategoryEngineContent() {
  const searchParams = useSearchParams();

  const selectedCatKey = searchParams.get('cat') || 'property';
  const selectedSubSlug = searchParams.get('sub');
  const selectedIntent = searchParams.get('intent') || 'sell';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Find active parent and subcategory
  const parentCat = CATEGORY_ENGINE_TAXONOMY.find(c => c.key === selectedCatKey || c.slug === selectedCatKey) || CATEGORY_ENGINE_TAXONOMY[0];
  const activeSubCat = parentCat.subCategories.find(s => s.slug === selectedSubSlug);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Lọc theo chuyên mục đang chọn (chuyên mục con nếu có, nếu không thì chuyên mục cha, gồm cả các chuyên mục con của nó).
    api.search({ categorySlug: activeSubCat?.slug ?? parentCat.slug, limit: 48 })
      .then(res => { if (active) setProducts(res.items); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedCatKey, selectedSubSlug, selectedIntent]);

  return (
    <main id="main-content" className="shell" style={{ marginTop: 16, marginBottom: 40 }}>
      {/* BREADCRUMB CẤU TRÚC RÕ RÀNG: Trang chủ / Danh mục cha / Danh mục con */}
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#475569', textDecoration: 'none' }}>Trang chủ</Link> /
        <Link href={`/categories?cat=${parentCat.key}`} style={{ color: selectedSubSlug ? '#475569' : '#00a65a', textDecoration: 'none', fontWeight: 600 }}>{parentCat.label}</Link>
        {activeSubCat && (
          <>
             / <span style={{ color: '#00a65a', fontWeight: 600 }}>{activeSubCat.name}</span>
          </>
        )}
      </nav>

      {/* TÁCH MỤC ĐÍCH ĐĂNG TIN (LISTING INTENTS) */}
      <div className="white-card-box" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {LISTING_INTENTS.map(intent => (
            <Link
              key={intent.code}
              href={`/categories?cat=${parentCat.key}&intent=${intent.code}`}
              style={{
                background: selectedIntent === intent.code ? '#00a65a' : '#f1f5f9',
                color: selectedIntent === intent.code ? '#ffffff' : '#334155',
                borderRadius: 999,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {intent.name}
            </Link>
          ))}
        </div>
      </div>

      {/* DANH SÁCH DANH MỤC CHA (14 CẤP LỚN - VỚI ICON 3D) */}
      <div className="white-card-box" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Tất cả danh mục sản phẩm</h2>
        <ScrollRow>
          {CATEGORY_ENGINE_TAXONOMY.map(cat => (
            <Link
              key={cat.key}
              data-active={parentCat.key === cat.key}
              href={`/categories?cat=${cat.key}`}
              style={{
                flex: '0 0 95px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: parentCat.key === cat.key ? '#e0f6e9' : 'transparent',
                border: parentCat.key === cat.key ? '2px solid #00a65a' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '10px 6px',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <img src={cat.icon} alt={cat.label} style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 6 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: parentCat.key === cat.key ? '#008247' : '#334155', textAlign: 'center', lineHeight: 1.2 }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </ScrollRow>
      </div>

      {/* DANH MỤC CON VỚI ICON 3D CỤ THỂ RIÊNG BIỆT (114 SUBCATEGORY ICONS) */}
      <div className="white-card-box" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Chuyên mục con: {parentCat.label}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
          {parentCat.subCategories.map(sub => (
            <SubCategoryButton
              key={sub.slug}
              sub={sub}
              parentIcon={parentCat.icon}
              parentKey={parentCat.key}
              selectedSubSlug={selectedSubSlug}
              selectedIntent={selectedIntent}
            />
          ))}
        </div>
      </div>

      {/* TẤT CẢ TIN ĐĂNG THEO DANH MỤC (DEFAULT PRODUCT GRID 4X3) */}
      <div className="white-card-box">
        <div className="section-title">
          <h2>
            <Flame color="#00a65a" size={20} />
            {activeSubCat ? `Tin đăng: ${activeSubCat.name}` : `Tin đăng: ${parentCat.label}`}
          </h2>
        </div>

        <div className="products-grid-4">
          {loading ? (
            <p style={{ padding: 20, color: '#666', gridColumn: 'span 4' }}>Đang tải tin đăng...</p>
          ) : products.length > 0 ? (
            products.map(p => <ProductCard key={p.id} product={p} />)
          ) : (
            <p style={{ padding: 30, textAlign: 'center', color: '#64748b', gridColumn: 'span 4' }}>Chưa có tin đăng trong danh mục này.</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="shell" style={{ padding: 40, textAlign: 'center' }}>Đang tải danh mục...</div>}>
      <CategoryEngineContent />
    </Suspense>
  );
}
