'use client';

import { Ic } from '../../../components/Ic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { readSession } from '../../../lib/auth';
import Link from 'next/link';
import {
  Heart, Share2, ShieldAlert, MapPin, Clock, Eye,
  CheckCircle, MessageSquare, ShoppingCart, ShieldCheck, Flame,
  ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, RotateCcw, Maximize, Pencil, LayoutList, Play, BadgeCheck, Lock, TriangleAlert, Star, ArrowRight } from 'lucide-react';
import { api, memberRequest, Product } from '../../../lib/api';
import { formatVnd } from '../../../lib/marketplace';
import { ProductTools } from '../../../components/vertical/ProductTools';
import './listing-detail.css';

function formatCondition(condition?: string | null) {
  if (!condition) return 'Đã qua sử dụng (Tốt)';
  const upper = condition.toUpperCase().replace(/[\s-]+/g, '_');
  switch (upper) {
    case 'NEW':
      return 'Mới 100%';
    case 'LIKE_NEW':
    case 'LIKENEW':
    case 'USED_LIKE_NEW':
      return 'Như mới (99%)';
    case 'USED_GOOD':
      return 'Đã qua sử dụng (Tốt)';
    case 'USED_FAIR':
      return 'Đã qua sử dụng (Cũ / Tương đối)';
    case 'FOR_PARTS':
      return 'Cần sửa / lấy linh kiện';
    case 'REFURBISHED':
      return 'Đã tân trang / Sửa chữa';
    default:
      return condition.replace(/_/g, ' ');
  }
}

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
  const [sellerInfo, setSellerInfo] = useState<{ user: { avatarUrl: string | null; verified: boolean; activeListings: number }; summary: { count: number; average: number } } | null>(null);
  useEffect(() => {
    if (!product?.sellerId) return;
    let live = true;
    fetch(`/api/v1/users/${encodeURIComponent(product.sellerId)}/reviews?role=seller`).then(r => r.json()).then(j => { if (live && j?.success) setSellerInfo(j.data); }).catch(() => undefined);
    return () => { live = false; };
  }, [product?.sellerId]);
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
  const [reportOpen, setReportOpen] = useState(false), [reportReason, setReportReason] = useState('FRAUD'), [reportDetails, setReportDetails] = useState(''), [reportBusy, setReportBusy] = useState(false), [reportError, setReportError] = useState('');

  const router = useRouter();
  const openChat = () => {
    const target = '/messages?product=' + encodeURIComponent(String(product?.id ?? ''));
    if (!readSession()) { router.push('/login?next=' + encodeURIComponent(target)); return; }
    router.push(target);
  };
  const openReport = () => {
    if (!readSession()) { router.push('/login?next=' + encodeURIComponent('/products/' + String(product?.id ?? ''))); return; }
    setReportError(''); setReportOpen(true);
  };
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportBusy || !product) return;
    setReportBusy(true); setReportError('');
    try {
      await memberRequest('/reports', 'POST', { productId: product.id, reason: reportReason, details: reportDetails.trim() || undefined });
      setReportOpen(false); setReportDetails('');
      showToast('Đã gửi báo cáo tới quản trị viên. Cảm ơn bạn!');
    } catch (err) { setReportError(err instanceof Error ? err.message : 'Không gửi được báo cáo. Hãy thử lại.'); }
    finally { setReportBusy(false); }
  };
  const buyNow = () => {
    const mode = product?.priceMode;
    if (mode && mode !== 'FIXED') { openChat(); return; } // tin liên hệ/tặng/giá theo đơn vị: trao đổi trước qua chat
    const target = '/checkout/' + encodeURIComponent(String(product?.id ?? ''));
    if (!readSession()) { router.push('/login?next=' + encodeURIComponent(target)); return; }
    router.push(target);
  };
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
          <h2 style={{ fontSize: 20, color: '#0f172a', marginBottom: 8 }}>{error && !/không tìm thấy/i.test(error) ? 'Không tải được tin đăng' : 'Tin đăng không tồn tại hoặc đã bị gỡ'}</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error && !/không tìm thấy/i.test(error) ? `Có lỗi khi tải tin: ${error}. Bạn hãy thử tải lại trang.` : 'Sản phẩm này có thể đã được bán, hết hạn hiển thị, đang chờ duyệt hoặc đã bị chủ tin gỡ. Nếu đây là tin của bạn, hãy vào "Tin đăng của tôi" để kiểm tra trạng thái.'}</p>
          <Link href="/" style={{ background: '#00a65a', color: '#fff', padding: '10px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>Quay lại Trang chủ</Link>
        </div>
      </main>
    );
  }

  const catPath = getCategoryPath(product);

  // Gallery images array
  const images = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : ['/assets/product-1.jpg']);

  // Album chung: ảnh trước, video sau (ảnh giữ nguyên chỉ số cho khung xem phóng to)
  const videos = product.videos ?? [];
  const media: { type: 'image' | 'video'; src: string }[] = [...images.map(src => ({ type: 'image' as const, src })), ...videos.map(src => ({ type: 'video' as const, src }))];
  const current = media[Math.min(selectedImgIndex, media.length - 1)];

  const hotProducts = allProducts.filter(p => p.id !== product.id).slice(0, 5);
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(2, 8);

  return (
    <main className="shell detail-page-container">
      {toast && (
        <div className="toast-notification">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {product && product.status && product.status !== 'ACTIVE' && (
        <div role="status" style={{ margin: '12px 0', padding: '10px 14px', borderRadius: 10, background: '#fff8ec', border: '1px solid #f5c98a', color: '#8a4b00', fontSize: 14 }}>
          <Ic i={TriangleAlert}/>Tin này hiện <strong>chưa hiển thị công khai</strong> (trạng thái: {({ PENDING: 'chờ duyệt', PAUSED: 'tạm ẩn', SOLD: 'đã bán', EXPIRED: 'hết hạn', REJECTED: 'bị từ chối', DRAFT: 'bản nháp' } as Record<string, string>)[product.status] ?? product.status}). Chỉ bạn xem được trang này.
        </div>
      )}

      {reportOpen && (
        <div role="dialog" aria-modal="true" aria-label="Báo cáo tin đăng" onClick={() => setReportOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
          <form onClick={e => e.stopPropagation()} onSubmit={submitReport} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 'min(440px, 100%)', display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Báo cáo tin đăng</h3>
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>Lý do
              <select value={reportReason} onChange={e => setReportReason(e.target.value)}>
                {Object.entries({ FRAUD: 'Nghi lừa đảo', SPAM: 'Tin rác / trùng lặp', PROHIBITED: 'Hàng cấm / vi phạm quy định', ABUSE: 'Nội dung xúc phạm', OTHER: 'Lý do khác' }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>Mô tả thêm (không bắt buộc)
              <textarea rows={4} maxLength={1000} value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Ví dụ: người bán yêu cầu chuyển khoản trước rồi không giao hàng…" />
            </label>
            {reportError && <p role="alert" style={{ margin: 0, color: '#c0392b', fontSize: 13 }}>{reportError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setReportOpen(false)} disabled={reportBusy}>Hủy</button>
              <button type="submit" className="member-primary" disabled={reportBusy}>{reportBusy ? 'Đang gửi…' : 'Gửi báo cáo'}</button>
            </div>
          </form>
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
                {current.type === 'image' ? (
                  <div className="main-image-wrapper" onClick={() => setLightboxOpen(true)}>
                    <img src={current.src} alt={product.title} />
                    <span className="img-counter-badge">{selectedImgIndex + 1} / {media.length}</span>
                    <div className="zoom-hint-overlay">
                      <Maximize size={16} /> Xem phóng to
                    </div>
                  </div>
                ) : (
                  <div className="main-image-wrapper" style={{ cursor: 'default', background: '#000' }}>
                    <video key={current.src} src={current.src} controls playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}>
                      Trình duyệt của bạn không phát được video này. <a href={current.src} target="_blank" rel="noreferrer">Mở video</a>
                    </video>
                    <span className="img-counter-badge" style={{ pointerEvents: 'none' }}>Video · {selectedImgIndex + 1} / {media.length}</span>
                  </div>
                )}

                <div className="thumbnail-strip">
                  {media.map((m, idx) => (
                    <button
                      key={m.src + idx}
                      className={`thumb-btn ${selectedImgIndex === idx ? 'active' : ''}`}
                      style={m.type === 'video' ? { position: 'relative' } : undefined}
                      onClick={() => setSelectedImgIndex(idx)}
                      aria-label={m.type === 'video' ? 'Xem video' : `Xem ảnh ${idx + 1}`}
                    >
                      {m.type === 'image'
                        ? <img src={m.src} alt="" />
                        : <>
                            <video src={m.src + '#t=0.1'} muted preload="metadata" playsInline tabIndex={-1} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#111', pointerEvents: 'none' }} />
                            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.35)', color: '#fff', pointerEvents: 'none' }}><Play size={20} fill="#fff" /></span>
                          </>}
                    </button>
                  ))}
                </div>
              </div>

              {/* KHỐI THÔNG TIN CHÍNH */}
              <div className="detail-info-box">
                {product.condition !== null && (
                  <div className="condition-badge">
                    {formatCondition(product.condition)}
                  </div>
                )}

                <h1 className="detail-title">{product.title}</h1>

                <div className="detail-price-box">
                  <span className="detail-price">
                    {product.priceMode === 'CONTACT' ? 'LIÊN HỆ' : product.priceMode === 'FREE' ? 'TẶNG MIỄN PHÍ' : formatVnd(product.price)}
                  </span>
                  {(product as any).negotiable && <span className="nego-badge">Có thương lượng</span>}
                </div>

                <div className="detail-meta-list">
                  <div><MapPin size={15} color="#00a65a" /> {product.location || 'Chưa cập nhật'}</div>
                  <div><Clock size={15} /> Đăng {new Date(product.postedAt).toLocaleDateString('vi-VN')}</div>
                  <div><Eye size={15} /> 245 lượt xem · Mã tin: <b>TTT-{product.id.slice(0, 6)}</b></div>
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

                  <button className="detail-act-btn danger" onClick={openReport}>
                    <ShieldAlert size={18} /> Báo cáo tin
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD NGƯỜI BÁN */}
          <div className="white-card-box seller-card">
            <div className="seller-card-flex">
              <Link href={`/sellers/${product.sellerId}`} className="seller-left" style={{ textDecoration: 'none', color: 'inherit' }}>
                {sellerInfo?.user.avatarUrl ? <img src={sellerInfo.user.avatarUrl} alt={product.sellerName} className="seller-avatar-large" /> : <div className="seller-avatar-large" style={{ display: 'grid', placeItems: 'center', background: '#e6f6ed', color: '#007c4b', fontWeight: 800, fontSize: 24 }}>{product.sellerName.slice(0, 1).toUpperCase()}</div>}
                <div>
                  <div className="seller-name-row">
                    <h3>{product.sellerName}</h3>
                    {sellerInfo?.user.verified && <span className="verified-badge"><Ic i={BadgeCheck}/>Đã xác minh</span>}
                  </div>
                  <p className="seller-joined">{sellerInfo ? <>{sellerInfo.summary.count ? <><Ic i={Star} fill="#f5a623" style={{ color: '#f5a623' }}/>{sellerInfo.summary.average.toFixed(1)} ({sellerInfo.summary.count} đánh giá) · </> : 'Chưa có đánh giá · '}{sellerInfo.user.activeListings} tin đang đăng</> : ' '}</p>
                </div>
              </Link>

              {readSession()?.user.id === product.sellerId ? (
                <div className="seller-actions">
                  <Link href={product.listingId ? '/sell?listing=' + encodeURIComponent(product.listingId) : '/account'} className="btn-chat-primary" style={{ textDecoration: 'none', color: '#fff', fontSize: 14 }}>
                    <Pencil size={18} /> Sửa tin đăng
                  </Link>
                  <Link href="/account" className="btn-buy-secondary" style={{ textDecoration: 'none', color: '#0f172a', fontSize: 14 }}>
                    <LayoutList size={18} /> Tin đăng của tôi
                  </Link>
                </div>
              ) : (
              <div className="seller-actions">
                  <button className="btn-chat-primary" onClick={openChat}>
                    <MessageSquare size={18} /> Nhắn tin ngay
                  </button>
                  <button className="btn-buy-secondary" onClick={buyNow}>
                    <ShoppingCart size={18} /> {!product.priceMode || product.priceMode === 'FIXED' ? 'Mua ngay / Giao dịch' : product.priceMode === 'FREE' ? 'Xin nhận tặng' : product.priceMode === 'CONTACT' ? 'Hỏi giá' : 'Hỏi thuê / đặt lịch'}
                  </button>
  
                </div>
              )}
            </div>

            {product.priceMode && product.priceMode !== 'FIXED' && <p className="seller-joined" style={{ margin: '8px 0 0' }}>Tin này không có giá cố định nên chưa đặt mua trực tiếp được. Hãy nhắn người bán để thỏa thuận giá và cách giao dịch.</p>}

            <div className="privacy-note">
              <Ic i={Lock}/>Tất Tần Tật bảo vệ thông tin cá nhân. Vui lòng liên hệ và giao dịch trực tiếp qua hệ thống để đảm bảo an toàn.
            </div>
          </div>

          {/* MÔ TẢ TIN ĐĂNG */}
          <div className="white-card-box description-card">
            <h2 className="section-subtitle">Mô tả chi tiết</h2>

            {/* BẢNG THÔNG SỐ SẢN PHẨM */}
            <div className="product-specs-table">
              {product.condition !== null && (
                <div className="spec-row">
                  <span className="spec-label">Tình trạng:</span>
                  <span className="spec-val">{formatCondition(product.condition)}</span>
                </div>
              )}
              <div className="spec-row">
                <span className="spec-label">Khu vực:</span>
                <span className="spec-val">{product.location || 'Quy Nhơn, Bình Định'}</span>
              </div>
            </div>
            <ProductTools productId={product.id} />

            <div className={`description-text ${showFullDesc ? 'expanded' : ''}`}>
              {product.description?.trim() || 'Người bán chưa cung cấp mô tả chi tiết. Hãy nhắn tin để hỏi thêm về sản phẩm.'}
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
                    <span className="hot-item-location"><Ic i={MapPin}/>{hot.location || 'Quy Nhơn'}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/categories" className="hot-view-more">Xem thêm tin HOT <Ic i={ArrowRight} after/></Link>
          </div>
        </aside>
      </div>

      {/* TIN LIÊN QUAN CUỐI TRANG */}
      <section className="related-listings-section white-card-box" style={{ marginTop: 24 }}>
        <div className="section-title">
          <h2><Flame size={20} color="#00a65a" /> Tin liên quan</h2>
          <Link href="/categories" className="view-all">Xem thêm tin tương tự <Ic i={ArrowRight} after/></Link>
        </div>

        <div className="products-grid-4">
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
                  <div className="location-row"><Ic i={MapPin}/>{rel.location || 'Quy Nhơn'}</div>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
