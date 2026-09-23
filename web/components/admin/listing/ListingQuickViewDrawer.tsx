'use client';

import { X, ExternalLink, Check, EyeOff, Eye, Edit, Trash2, ShieldAlert, Copy, MapPin, Clock, Tag, User } from 'lucide-react';
import Link from 'next/link';

interface PostItem {
  id: string;
  title: string;
  price: string;
  status: string;
  image_url: string;
  category_name: string;
  seller_name: string;
  seller_email: string;
  seller_phone?: string;
  description?: string;
  created_at: string;
  location?: string;
}

interface QuickViewDrawerProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onUnhide: (id: string) => void;
  onHide: (id: string) => void;
  onEdit: (post: PostItem) => void;
  onDelete: (id: string) => void;
  onToast: (msg: string) => void;
}

function formatVnd(val: string | number) {
  const num = typeof val === 'number' ? val : parseInt(val || '0', 10);
  if (isNaN(num) || num === 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
}

function formatStatusBadge(status: string) {
  const upper = (status || '').toUpperCase();
  if (upper === 'ACTIVE') {
    return { label: 'Đã duyệt', bg: '#059669', color: '#ffffff' };
  }
  if (upper === 'PENDING') {
    return { label: 'Chờ duyệt', bg: '#d97706', color: '#ffffff' };
  }
  if (upper === 'HIDDEN') {
    return { label: 'Đã ẩn', bg: '#64748b', color: '#ffffff' };
  }
  if (['COMPLETED', 'SOLD', 'RESERVED', 'DELIVERED'].includes(upper)) {
    return { label: 'Đã bán', bg: '#2563eb', color: '#ffffff' };
  }
  if (upper === 'REJECTED') {
    return { label: 'Từ chối', bg: '#dc2626', color: '#ffffff' };
  }
  return { label: status, bg: '#64748b', color: '#ffffff' };
}

export function ListingQuickViewDrawer({
  post,
  isOpen,
  onClose,
  onApprove,
  onUnhide,
  onHide,
  onEdit,
  onDelete,
  onToast
}: QuickViewDrawerProps) {
  if (!isOpen || !post) return null;

  const copyId = () => {
    navigator.clipboard?.writeText(post.id);
    onToast('Đã sao chép mã tin!');
  };

  const isPending = post.status === 'PENDING';
  const isHidden = post.status === 'HIDDEN';
  const isActive = post.status === 'ACTIVE';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          height: '100%',
          background: '#ffffff',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Xem nhanh tin đăng</h3>
            <button
              onClick={copyId}
              style={{
                background: '#e2e8f0',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 12,
                color: '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Sao chép ID"
            >
              #{post.id.slice(0, 8)} <Copy size={12} />
            </button>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#e2e8f0', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} color="#475569" />
          </button>
        </div>

        {/* DRAWER BODY */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* MAIN IMAGE */}
          <div style={{ width: '100%', height: 260, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', position: 'relative' }}>
            <img
              src={post.image_url || '/assets/product-1.jpg'}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', top: 12, right: 12 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  color: formatStatusBadge(post.status).color,
                  background: formatStatusBadge(post.status).bg
                }}
              >
                {formatStatusBadge(post.status).label}
              </span>
            </div>
          </div>

          {/* TITLE & PRICE */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.35 }}>
              {post.title}
            </h2>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>
              {formatVnd(post.price)}
            </div>
          </div>

          {/* DETAILS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>DANH MỤC</span>
              <strong style={{ color: '#0f172a' }}>{post.category_name}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>THỜI GIAN ĐĂNG</span>
              <strong style={{ color: '#0f172a' }}>{new Date(post.created_at).toLocaleString('vi-VN')}</strong>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>NGƯỜI BÁN</span>
              <strong style={{ color: '#0f172a' }}>{post.seller_name}</strong>
              <div style={{ color: '#64748b', fontSize: 12 }}>{post.seller_email} {post.seller_phone ? `· ${post.seller_phone}` : ''}</div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>Mô tả chi tiết</h4>
            <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, background: '#ffffff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-line' }}>
              {post.description || 'Không có mô tả thêm.'}
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER ACTIONS */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {isPending && (
              <button
                onClick={() => { onApprove(post.id); onClose(); }}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={16} /> Duyệt tin
              </button>
            )}

            {isHidden ? (
              <button
                onClick={() => { onUnhide(post.id); onClose(); }}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Eye size={16} /> Hiện lại
              </button>
            ) : isActive ? (
              <button
                onClick={() => { onHide(post.id); onClose(); }}
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <EyeOff size={16} /> Ẩn tin
              </button>
            ) : null}

            <button
              onClick={() => { onEdit(post); onClose(); }}
              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit size={16} /> Sửa tin
            </button>
          </div>

          <button
            onClick={() => { onDelete(post.id); onClose(); }}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={16} /> Xóa tin
          </button>
        </div>
      </div>
    </div>
  );
}
