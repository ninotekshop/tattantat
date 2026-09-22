'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Flame, ArrowRight, Heart, Filter, ChevronRight } from 'lucide-react';
import { api, type Product } from '../../lib/api';
import { formatVnd, CATEGORY_ENGINE_TAXONOMY, LISTING_INTENTS, ParentCategorySpec, SubCategorySpec } from '../../lib/marketplace';

function ProductCard({ product }: { product: Product }) {
  const [failedImage, setFailedImage] = useState(false);
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
            src={product.imageUrl && !failedImage ? product.imageUrl : '/assets/product-1.jpg'}
            alt={product.title}
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        </Link>
      </div>

      <div className="card-body">
        <Link href={'/products/' + product.id} style={{textDecoration:'none', color:'inherit'}}>
          <h3 className="card-title-full">{product.title}</h3>
          <div className="price-row">
            <span className="price">{product.priceMode==='CONTACT' ? 'LIÊN HỆ' : product.priceMode==='FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}</span>
          </div>
          <div className="location-row">
            📍 {product.location || 'Quy Nhơn'}
          </div>
          <div className="card-seller-name">
            👤 {product.sellerName}
          </div>
        </Link>
      </div>
    </article>
  );
}

function CategoryEngineContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

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
            <button
              key={intent.code}
              onClick={() => router.push(`/categories?cat=${parentCat.key}&intent=${intent.code}`)}
              style={{
                background: selectedIntent === intent.code ? '#00a65a' : '#f1f5f9',
                color: selectedIntent === intent.code ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: 999,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {intent.name}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH DANH MỤC CHA (14 CẤP LỚN - VỚI ICON 3D) */}
      <div className="white-card-box" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Tất cả danh mục sản phẩm</h2>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {CATEGORY_ENGINE_TAXONOMY.map(cat => (
            <button
              key={cat.key}
              onClick={() => router.push(`/categories?cat=${cat.key}`)}
              style={{
                flex: '0 0 95px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: parentCat.key === cat.key ? '#e0f6e9' : 'transparent',
                border: parentCat.key === cat.key ? '2px solid #00a65a' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '10px 6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <img src={cat.icon} alt={cat.label} style={{ width: 44, height: 44, objectFit: 'contain', marginBottom: 6 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: parentCat.key === cat.key ? '#008247' : '#334155', textAlign: 'center', lineHeight: 1.2 }}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DANH MỤC CON VỚI ICON 3D TƯƠNG TỰ DANH MỤC CHA */}
      <div className="white-card-box" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Chuyên mục con: {parentCat.label}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
          {parentCat.subCategories.map(sub => (
            <button
              key={sub.slug}
              onClick={() => router.push(`/categories?cat=${parentCat.key}&sub=${sub.slug}&intent=${selectedIntent}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: selectedSubSlug === sub.slug ? '#e0f6e9' : '#f8fafc',
                border: selectedSubSlug === sub.slug ? '2px solid #00a65a' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <img src={sub.icon} alt={sub.name} style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedSubSlug === sub.slug ? '#008247' : '#1e293b' }}>
                {sub.name}
              </span>
            </button>
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

      {/* TẤT CẢ TIN ĐĂNG THEO DANH MỤC (PRODUCT GRID) */}
      <div className="white-card-box">
        <div className="section-title">
          <h2>
            <Flame color="#00a65a" size={20} />
            {activeSubCat ? `Tin đăng: ${activeSubCat.name}` : `Tin đăng: ${parentCat.label}`}
          </h2>
        </div>

        <div className="products-grid-6">
          {loading ? (
            <p style={{ padding: 20, color: '#666', gridColumn: 'span 6' }}>Đang tải tin đăng...</p>
          ) : products.length > 0 ? (
            products.map(p => <ProductCard key={p.id} product={p} />)
          ) : (
            <p style={{ padding: 30, textAlign: 'center', color: '#64748b', gridColumn: 'span 6' }}>Chưa có tin đăng trong danh mục này.</p>
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
