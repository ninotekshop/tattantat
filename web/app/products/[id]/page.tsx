'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, Product } from '../../../lib/api';
import { formatVnd } from '../../../lib/marketplace';
import { listingPrice } from '../../../lib/listings';
import { PublishedListing } from '../../../components/listings/PublishedListing';
import { ProductActions } from '../../../components/ProductActions';
import './listing-detail.css';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let active = true;
    setProduct(null);
    setLoading(true);
    setError(null);
    void api.product(params.id)
      .then(value => { if (active) setProduct(value); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Không thể tải tin đăng'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.id]);

  return (
    <main className="detail-page">
      <header className="topbar">
        <a className="brand" href="/">Tất Tần Tật</a>
        <nav aria-label="Điều hướng chính"><a href="/">Khám phá</a><a href="/login">Đăng nhập</a><a className="sell-link" href="/sell">Đăng tin</a></nav>
      </header>
      <section className="detail-shell">
        <a className="back-link" href="/">← Quay lại khám phá</a>
        {loading ? <p className="feedback">Đang tải tin đăng...</p> : null}
        {error ? <div className="feedback error"><p>{error}</p><a href="/">Về trang chủ</a></div> : null}
        {product ? <article className="detail-card">
          <div className="detail-image">{product.imageUrl ? <img alt={product.title} src={product.imageUrl} /> : <div className="image-placeholder">Chưa có ảnh</div>}</div>
          <div className="detail-content">
            <p className="eyebrow">{product.condition || 'ĐÃ QUA SỬ DỤNG'}</p>
            <h1>{product.title}</h1>
            <p className="detail-price">{product.listingId?listingPrice({price:product.price.replace(/\.0+$/,''),priceMode:product.priceMode}):formatVnd(product.price)}</p>
            <p className="detail-meta">📍 {product.location}</p>
            <p className="detail-meta">Người bán: <strong>{product.sellerName}</strong></p>
            <hr />
            <h2>Mô tả</h2>
            <p className="description">{product.description?.trim() || 'Người bán chưa thêm mô tả cho sản phẩm này.'}</p>
            {product.listingId && <PublishedListing id={product.listingId}/>}
            <ProductActions key={product.id} product={product}/>
          </div>
        </article> : null}
      </section>
    </main>
  );
}
