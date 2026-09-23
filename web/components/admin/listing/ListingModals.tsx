'use client';

import { X, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PostItem {
  id: string;
  title: string;
  price: string;
  status: string;
  description?: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  postTitle?: string;
}

export function DeleteListingModal({ isOpen, onClose, onConfirm, postTitle }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: 16, width: '90%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Trash2 size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>Xóa tin đăng?</h3>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, textAlign: 'center', margin: '0 0 20px' }}>
          Tin đăng <b style={{ color: '#0f172a' }}>"{postTitle}"</b> sẽ bị xóa khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
            Hủy
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  isOpen: boolean;
  post: PostItem | null;
  onClose: () => void;
  onSave: (form: { title: string; price: string; status: string; description: string }) => void;
}

export function EditListingModal({ isOpen, post, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState({ title: '', price: '', status: 'ACTIVE', description: '' });

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        price: post.price || '',
        status: post.status || 'ACTIVE',
        description: post.description || ''
      });
    }
  }, [post]);

  if (!isOpen || !post) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#ffffff', borderRadius: 16, width: '90%', maxWidth: 540, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Chỉnh sửa tin đăng</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Tiêu đề tin *</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Giá bán (VND)</label>
              <input type="text" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Trạng thái</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}>
                <option value="ACTIVE">● Đã duyệt (Active)</option>
                <option value="PENDING">● Chờ duyệt</option>
                <option value="HIDDEN">● Đã ẩn</option>
                <option value="REJECTED">● Từ chối / Vi phạm</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Mô tả chi tiết</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={() => onSave(form)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#00a65a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}
