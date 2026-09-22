'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart, Share2, ShieldAlert, MapPin, Clock, Eye,
  CheckCircle, MessageSquare, ShoppingCart, ShieldCheck, Flame,
  ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, RotateCcw, Maximize
} from 'lucide-react';
import { api, Product } from '../../../lib/api';
import { formatVnd } from '../../../lib/marketplace';
import './listing-detail.css';

function getCategoryPath(product: Product) {
  const title = (product.title || '').toLowerCase();

  if (title.includes('iphone') || title.includes('điện thoại') || title.includes('samsung') || title.includes('oppo')) {
    return {
      parent: { name: 'Đồ công nghệ', slug: 'electronics' },
      sub: { name: 'Điện thoại', slug: 'dien-thoai' },
    };
  }
  if (title.includes('laptop') || title.includes('macbook') || title.includes('máy tính')) {
    return {
      parent: { name: 'Đồ công nghệ', slug: 'electronics' },
      sub: { name: 'Laptop & Máy tính', slug: 'laptop' },
    };
  }
  if (title.includes('xe') || title.includes('honda') || title.includes('wave') || title.includes('vision')) {
    return {
      parent: { name: 'Xe cộ', slug: 'vehicles' },
      sub: { name: 'Xe máy', slug: 'xe-may' },
    };
  }
  if (title.includes('nhà') || title.includes('căn hộ') || title.includes('đất') || title.includes('chung cư')) {
    return {
      parent: { name: 'Nhà đất', slug: 'property' },
      sub: { name: 'Nhà ở & Căn hộ', slug: 'nha-o' },
    };
  }
  if (title.includes('tủ lạnh') || title.includes('máy giặt') || title.includes('sofa') || title.includes('bàn ghế')) {
    return {
      parent: { name: 'Đồ gia dụng', slug: 'home-appliances' },
      sub: { name: 'Đồ dùng phòng khách & Bếp', slug: 'do-dung-bep' },
    };
  }
  if (title.includes('thời trang') || title.includes('áo') || title.includes('quần') || title.includes('giày')) {
    return {
      parent: { name: 'Thời trang', slug: 'fashion' },
      sub: { name: 'Quần áo nam nữ', slug: 'quan-ao' },
    };
  }
  if (title.includes('thú cưng') || title.includes('chó') || title.includes('mèo')) {
    return {
      parent: { name: 'Thú cưng', slug: 'pets' },
      sub: { name: 'Chó & Mèo cảnh', slug: 'cho-meo' },
    };
  }
  if (title.includes('sách') || title.includes('học tập')) {
    return {
      parent: { name: 'Sách & học tập', slug: 'books' },
      sub: { name: 'Sách tham khảo & Lập trình', slug: 'sach-lap-trinh' },
    };
  }
  return {
    parent: { name: 'Hàng hóa khác', slug: 'others' },
    sub: { name: 'Sản phẩm khác', slug: 'san-pham-khac' },
  };
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery & Lightbox state
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Listing actions state
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!params.id) return;
    let active = true;
    setProduct(null);
    setLoading(true);
    setError(null);

    Promise.all([
      api.product(params.id),
      api.products('').catch(() => [])
    ])
      .then(([val, list]) => {
        if (active) {
          setProduct(val);
          setAllProducts(list);
        }
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tìm thấy tin đăng hoặc tin đã hết hạn');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [params.id]);

  // Lightbox Keyboard controls
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setSelectedImgIndex(prev => (prev > 0 ? prev - 1 : prev));
      if (e.key === 'ArrowRight') setSelectedImgIndex(prev => (images.length > 0 && prev < images.length - 1 ? prev + 1 : prev));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  if (loading) {
    return (
      <main className="shell detail-page-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, height: 450, padding: 24 }} />
          <div style={{ background: '#fff', borderRadius: 16, height: 450, padding: 24 }} />
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="shell detail-page-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="white-card-box" style={{ maxWidth: 500, margin: '0 auto', padding: 40 }}>
          <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, color: '#0f172a', marginBottom: 8 }}>Tin đăng không tồn tại hoặc đã bị gỡ</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Sản phẩm này có thể đã được bán hoặc hết hạn hiển thị trên Tất Tần Tật.</p>
          <Link href="/" style={{ background: '#00a65a', color: '#fff', padding: '10px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>Quay lại Trang chủ</Link>
        </div>
      </main>
    );
  }

  const catPath = getCategoryPath(product);

  // Gallery images array
  const images = product.imageUrl
    ? [product.imageUrl, '/assets/product-2.jpg', '/assets/product-3.jpg', '/assets/product-4.jpg']
    : ['/assets/product-1.jpg', '/assets/product-2.jpg'];

  const hotProducts = allProducts.filter(p => p.id !== product.id).slice(0, 5);
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(2, 8);

  return (
    <main className="shell detail-page-container">
      {toast && (
        <div className="toast-notification">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* LIGHTBOX MODAL FULLSCREEN */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-toolbar" onClick={e => e.stopPropagation()}>
            <span className="lightbox-counter">{selectedImgIndex + 1} / {images.length}</span>
            <div className="lightbox-btns">
              <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))} title="Phóng to"><ZoomIn size={18} /></button>
              <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))} title="Thu nhỏ"><ZoomOut size={18} /></button>
              <button onClick={() => setZoomLevel(1)} title="Đặt lại"><RotateCcw size={18} /></button>
              <button onClick={() => setLightboxOpen(false)} title="Đóng (ESC)"><X size={20} /></button>
            </div>
          </div>

          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="lightbox-nav prev"
              onClick={() => setSelectedImgIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            >
              <ChevronLeft size={28} />
            </button>

            <img
              src={images[selectedImgIndex]}
              alt={product.title}
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}
            />

            <button
              className="lightbox-nav next"
              onClick={() => setSelectedImgIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* BREADCRUMB CẤU TRÚC RÕ RÀNG: Trang chủ / Danh mục cha / Danh mục con / Tên sản phẩm */}
      <nav className="detail-breadcrumb">
        <Link href="/">Trang chủ</Link> /
        <Link href={`/categories?cat=${catPath.parent.slug}`}>{catPath.parent.name}</Link> /
        <Link href={`/categories?cat=${catPath.parent.slug}&sub=${catPath.sub.slug}`}>{catPath.sub.name}</Link> /
        <span>{product.title}</span>
      </nav>

      <div className="detail-layout-grid">
        {/* LEFT MAIN COLUMN */}
        <div className="detail-main-col">
          <div className="white-card-box detail-hero-card">
            <div className="detail-hero-flex">
              {/* GALLERY ALBUM ẢNH */}
              <div className="detail-gallery-box">
                <div className="main-image-wrapper" onClick={() => setLightboxOpen(true)}>
                  <img src={images[selectedImgIndex]} alt={product.title} />
                  <span className="img-counter-badge">{selectedImgIndex + 1} / {images.length}</span>
                  <div className="zoom-hint-overlay">
                    <Maximize size={16} /> Xem phóng to
                  </div>
                </div>

                <div className="thumbnail-strip">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      className={`thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImgIndex(idx)}
                    >
                      <img src={imgUrl} alt="" />
                    </button>
                  ))}
                </div>
              </div>

              {/* KHỐI THÔNG TIN CHÍNH */}
              <div className="detail-info-box">
                <div className="condition-badge">
                  {product.condition || 'ĐÃ QUA SỬ DỤNG'}
                </div>

                <h1 className="detail-title">{product.title}</h1>

                <div className="detail-price-box">
                  <span className="detail-price">
                    {product.priceMode === 'CONTACT' ? 'LIÊN HỆ' : product.priceMode === 'FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}
                  </span>
                  {(product as any).negotiable && <span className="nego-badge">Có thương lượng</span>}
                </div>

                <div className="detail-meta-list">
                  <div><MapPin size={15} color="#00a65a" /> {product.location || 'Quy Nhơn, Bình Định'}</div>
                  <div><Clock size={15} color="#64748b" /> Đăng {new Date(product.postedAt).toLocaleDateString('vi-VN')}</div>
                  <div><Eye size={15} color="#64748b" /> 245 lượt xem · Mã tin: <b>TTT-{product.id.slice(0, 6)}</b></div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="detail-actions-row">
                  <button
                    className={`detail-act-btn ${isFavorite ? 'active' : ''}`}
                    onClick={() => {
                      setIsFavorite(!isFavorite);
                      showToast(isFavorite ? 'Đã bỏ lưu tin' : 'Đã lưu tin đăng vào Yêu thích!');
                    }}
                  >
                    <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : '#475569'} />
                    {isFavorite ? 'Đã lưu' : 'Lưu tin'}
                  </button>

                  <button className="detail-act-btn" onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Đã sao chép liên kết tin đăng!'); }}>
                    <Share2 size={18} /> Chia sẻ
                  </button>

                  <button className="detail-act-btn danger" onClick={() => showToast('Đã gửi báo cáo vi phạm tới quản trị viên!')}>
                    <ShieldAlert size={18} /> Báo cáo tin
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD NGƯỜI BÁN */}
          <div className="white-card-box seller-card">
            <div className="seller-card-flex">
              <div className="seller-left">
                <img src="/assets/product-1.jpg" alt={product.sellerName} className="seller-avatar-large" />
                <div>
                  <div className="seller-name-row">
                    <h3>{product.sellerName}</h3>
                    <span className="verified-badge">✓ Đã xác thực</span>
                  </div>
                  <p className="seller-joined">Đã tham gia 1 năm · 12 tin đang đăng</p>
                </div>
              </div>

              <div className="seller-actions">
                <button className="btn-chat-primary" onClick={() => showToast('Đang kết nối tới hộp thoại nhắn tin...')}>
                  <MessageSquare size={18} /> Nhắn tin ngay
                </button>
                <button className="btn-buy-secondary" onClick={() => showToast('Đã ghi nhận yêu cầu đặt mua!')}>
                  <ShoppingCart size={18} /> Đặt mua / Giao dịch
                </button>
              </div>
            </div>

            <div className="privacy-note">
              🔒 Tất Tần Tật bảo vệ thông tin cá nhân. Vui lòng liên hệ và giao dịch trực tiếp qua hệ thống để đảm bảo an toàn.
            </div>
          </div>

          {/* MÔ TẢ TIN ĐĂNG */}
          <div className="white-card-box description-card">
            <h2 className="section-subtitle">Mô tả chi tiết</h2>

            {/* BẢNG THÔNG SỐ SẢN PHẨM */}
            <div className="product-specs-table">
              <div className="spec-row">
                <span className="spec-label">Tình trạng:</span>
                <span className="spec-val">{product.condition || 'Đã qua sử dụng'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Khu vực:</span>
                <span className="spec-val">{product.location || 'Quy Nhơn, Bình Định'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Bảo hành:</span>
                <span className="spec-val">Còn bảo hành 3 tháng</span>
              </div>
            </div>

            <div className={`description-text ${showFullDesc ? 'expanded' : ''}`}>
              {product.description?.trim() || 'Sản phẩm chính chủ cần bán nhanh. Tình trạng thực tế nguyên bản, chưa qua sửa chữa. Máy chạy mượt mà, đầy đủ phụ kiện kèm theo. Bao test trực tiếp tại chỗ.'}
            </div>

            <button className="toggle-desc-btn" onClick={() => setShowFullDesc(!showFullDesc)}>
              {showFullDesc ? 'Thu gọn ▲' : 'Xem thêm mô tả ▼'}
            </button>
          </div>

          {/* MUA BÁN AN TOÀN */}
          <div className="white-card-box safety-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#00a65a', fontWeight: 700, marginBottom: 8 }}>
              <ShieldCheck size={22} /> Mua bán an toàn trên Tất Tần Tật
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
              <li>Nên giao dịch trực tiếp, kiểm tra hàng kỹ trước khi thanh toán.</li>
              <li>Không chuyển khoản hoặc cọc tiền trước khi xác minh rõ thông tin.</li>
              <li>Báo cáo ngay cho ban quản trị nếu thấy dấu hiệu nghi vấn vi phạm.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT SIDEBAR: TIN ĐANG HOT */}
        <aside className="detail-sidebar-col">
          <div className="white-card-box sticky-hot-box">
            <h3 className="hot-sidebar-title"><Flame color="#ef4444" size={18} /> Tin đang HOT</h3>
            <div className="hot-list">
              {hotProducts.map(hot => (
                <Link href={'/products/' + hot.id} key={hot.id} className="hot-item-card">
                  <img src={hot.imageUrl || '/assets/product-1.jpg'} alt={hot.title} />
                  <div className="hot-item-info">
                    <h4>{hot.title}</h4>
                    <strong className="hot-item-price">{formatVnd(hot.price)}</strong>
                    <span className="hot-item-location">📍 {hot.location || 'Quy Nhơn'}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/categories" className="hot-view-more">Xem thêm tin HOT →</Link>
          </div>
        </aside>
      </div>

      {/* TIN LIÊN QUAN CUỐI TRANG */}
      <section className="related-listings-section white-card-box" style={{ marginTop: 24 }}>
        <div className="section-title">
          <h2><Flame size={20} color="#00a65a" /> Tin liên quan</h2>
          <Link href="/categories" className="view-all">Xem thêm tin tương tự →</Link>
        </div>

        <div className="products-grid-6">
          {relatedProducts.map(rel => (
            <article key={rel.id} className="product-card">
              <div className="card-img">
                <Link href={'/products/' + rel.id}>
                  <img src={rel.imageUrl || '/assets/product-1.jpg'} alt={rel.title} />
                </Link>
              </div>
              <div className="card-body">
                <Link href={'/products/' + rel.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 className="card-title-full">{rel.title}</h3>
                  <div className="price-row">
                    <span className="price">{formatVnd(rel.price)}</span>
                  </div>
                  <div className="location-row">📍 {rel.location || 'Quy Nhơn'}</div>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
