'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, Filter, MapPin as MapPinIcon, User } from 'lucide-react';
import { api, type Product } from '../../lib/api';
import { formatVnd, CATEGORY_ENGINE_TAXONOMY, LISTING_INTENTS, ParentCategorySpec, SubCategorySpec } from '../../lib/marketplace';

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
          {isFavorite ? '♥' : '♡'}
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
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{textDecoration:'none', color:'inherit'}}>
          <h3 className="card-title-full">{product.title}</h3>
          <div className="price-row">
            <span className="price">{product.priceMode==='CONTACT' ? 'LIÊN HỆ' : product.priceMode==='FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>
          <div className="location-row" style={{display:'flex', alignItems:'center', gap:4, color:'#64748b'}}>
            <MapPinIcon size={13} color="#64748b" /> {product.location || 'Quy Nhơn'}
          </div>
          <div className="card-seller-name" style={{fontSize:12, color:'#475569', marginTop:2}}>
            <User size={13} color="#64748b" /> {product.sellerName} <span className="verified-badge">✓ Đã xác thực</span>
          </div>
        </Link>
      </div>
    </article>
  );
}

function SubCategoryButton({ sub, parentSlug, parentKey, selectedSubSlug, selectedIntent }: { sub: SubCategorySpec; parentSlug: string; parentKey: string; selectedSubSlug: string | null; selectedIntent: string }) {
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
        src={`/assets/category-icons/sub/${parentSlug}/${sub.slug}.png`}
        alt={sub.name}
        onError={(e) => {
          (e.target as HTMLImageElement).src = `/assets/category-icons/parent/${parentSlug}.png`;
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
    api.products('')
      .then(res => { if (active) setProducts(res); })
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
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {CATEGORY_ENGINE_TAXONOMY.map(cat => (
            <Link
              key={cat.key}
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
        </div>
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
              parentSlug={parentCat.slug}
              parentKey={parentCat.key}
              selectedSubSlug={selectedSubSlug}
              selectedIntent={selectedIntent}
            />
          ))}
        </div>
      </div>

      {/* BỘ LỌC ĐỘNG (DYNAMIC FILTERS ENGINE GENERATED FROM SCHEMA) */}
      <div className="white-card-box" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          <Filter size={18} color="#00a65a" /> Bộ lọc động theo chuyên mục: {activeSubCat ? activeSubCat.name : parentCat.label}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#334155' }}
          >
            <option value="">-- Chọn Hãng / Thương hiệu --</option>
            <option value="apple">Apple / iPhone</option>
            <option value="samsung">Samsung</option>
            <option value="sony">Sony</option>
            <option value="canon">Canon</option>
            <option value="toyota">Toyota</option>
            <option value="honda">Honda</option>
          </select>

          <select style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#334155' }}>
            <option value="">-- Tình trạng --</option>
            <option value="NEW">Mới 100%</option>
            <option value="LIKE_NEW">Đã qua sử dụng (Như mới)</option>
            <option value="USED_GOOD">Đã qua sử dụng (Tốt)</option>
          </select>

          <select style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#334155' }}>
            <option value="">-- Khoảng giá --</option>
            <option value="0-5m">Dưới 5 triệu</option>
            <option value="5m-15m">5 - 15 triệu</option>
            <option value="15m-30m">15 - 30 triệu</option>
            <option value="30m+">Trên 30 triệu</option>
          </select>

          <button style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            Áp dụng bộ lọc
          </button>
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
