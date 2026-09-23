'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Search, Filter, Plus, Clock, AlertTriangle, CheckCircle,
  Eye, Edit, Trash2, MoreVertical, Copy, ChevronLeft, ChevronRight,
  RefreshCw, Check, EyeOff, ShieldAlert, ArrowUpDown, X, Tag
} from 'lucide-react';
import { ListingQuickViewDrawer } from './ListingQuickViewDrawer';
import { DeleteListingModal, EditListingModal } from './ListingModals';

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
}

interface ListingCategory {
  id: string;
  name: string;
}

function formatVnd(val: string | number) {
  const num = typeof val === 'number' ? val : parseInt(val || '0', 10);
  if (isNaN(num) || num === 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
}

export function ListingManagementPage({
  posts,
  categories,
  onRefresh,
  onApprove,
  onUnhide,
  onHide,
  onSaveEdit,
  onDelete,
  onToast,
  getAuthHeaders
}: {
  posts: PostItem[];
  categories: ListingCategory[];
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onUnhide: (id: string) => void;
  onHide: (id: string) => void;
  onSaveEdit: (id: string, form: any) => void;
  onDelete: (id: string) => void;
  onToast: (msg: string) => void;
  getAuthHeaders: () => Record<string, string>;
}) {
  // STATE MANAGEMENT
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'HIDDEN' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // CHECKBOX SELECTION
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // MODAL & DRAWER STATE
  const [quickViewPost, setQuickViewPost] = useState<PostItem | null>(null);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostItem | null>(null);

  // DROPDOWN MENU ACTIVE STATE
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // COMPUTED STATS COUNTS
  const stats = useMemo(() => {
    const total = posts.length;
    const pending = posts.filter(p => p.status === 'PENDING').length;
    const active = posts.filter(p => p.status === 'ACTIVE').length;
    const hidden = posts.filter(p => p.status === 'HIDDEN').length;
    const rejected = posts.filter(p => p.status === 'REJECTED').length;
    return { total, pending, active, hidden, rejected };
  }, [posts]);

  // FILTERED & SORTED POSTS
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      // Tab status filter
      if (selectedTab === 'PENDING' && p.status !== 'PENDING') return false;
      if (selectedTab === 'ACTIVE' && p.status !== 'ACTIVE') return false;
      if (selectedTab === 'HIDDEN' && p.status !== 'HIDDEN') return false;
      if (selectedTab === 'REJECTED' && p.status !== 'REJECTED') return false;

      // Category filter
      if (selectedCategory && p.category_name !== selectedCategory) return false;

      // Time filter
      if (timeFilter !== 'ALL') {
        const postDate = new Date(p.created_at).getTime();
        const now = Date.now();
        if (timeFilter === 'TODAY' && now - postDate > 86400000) return false;
        if (timeFilter === '7D' && now - postDate > 7 * 86400000) return false;
        if (timeFilter === '30D' && now - postDate > 30 * 86400000) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchSeller = p.seller_name.toLowerCase().includes(q) || p.seller_email.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchSeller) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'created_at') {
        const tA = new Date(a.created_at).getTime();
        const tB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? tB - tA : tA - tB;
      }
      if (sortField === 'price') {
        const pA = parseInt(a.price || '0', 10);
        const pB = parseInt(b.price || '0', 10);
        return sortOrder === 'desc' ? pB - pA : pA - pB;
      }
      return 0;
    });
  }, [posts, selectedTab, selectedCategory, timeFilter, searchQuery, sortField, sortOrder]);

  // PAGINATED ITEMS
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // RESET PAGE ON FILTER CHANGE
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, selectedCategory, timeFilter, searchQuery]);

  // CHECKBOX SELECTION HANDLERS
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedPosts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSelectedTab('ALL');
    setSelectedCategory('');
    setTimeFilter('ALL');
    setSearchQuery('');
  };

  // BULK ACTIONS
  const handleBulkApprove = () => {
    selectedIds.forEach(id => onApprove(id));
    onToast(`Đã duyệt ${selectedIds.length} tin đăng!`);
    setSelectedIds([]);
  };

  const handleBulkHide = () => {
    selectedIds.forEach(id => onHide(id));
    onToast(`Đã ẩn ${selectedIds.length} tin đăng!`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.length} tin đăng đã chọn?`)) {
      selectedIds.forEach(id => onDelete(id));
      onToast(`Đã xóa ${selectedIds.length} tin đăng!`);
      setSelectedIds([]);
    }
  };

  const activeFilterCount = (selectedCategory ? 1 : 0) + (timeFilter !== 'ALL' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. HEADER SECTION (REQ 3) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Quản lý tin đăng
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
            Quản lý, kiểm duyệt và theo dõi toàn bộ tin đăng trên Tất Tần Tật.
          </p>
        </div>

        <Link
          href="/sell"
          target="_blank"
          style={{
            background: '#00a65a',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(0, 166, 90, 0.25)',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={18} /> Đăng tin mới
        </Link>
      </div>

      {/* 2. STATISTICS CARDS - ROW OF 5 COMPACT CARDS (REQ 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <div
          onClick={() => setSelectedTab('ALL')}
          style={{
            background: '#ffffff',
            border: selectedTab === 'ALL' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tổng tin đăng</span>
            <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Tất cả</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{stats.total.toLocaleString('vi-VN')}</div>
        </div>

        <div
          onClick={() => setSelectedTab('PENDING')}
          style={{
            background: '#ffffff',
            border: selectedTab === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Chờ duyệt</span>
            <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>● Chờ</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{stats.pending.toLocaleString('vi-VN')}</div>
        </div>

        <div
          onClick={() => setSelectedTab('ACTIVE')}
          style={{
            background: '#ffffff',
            border: selectedTab === 'ACTIVE' ? '2px solid #00a65a' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Đang hiển thị</span>
            <span style={{ background: '#d1fae5', color: '#059669', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>● Hoạt động</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{stats.active.toLocaleString('vi-VN')}</div>
        </div>

        <div
          onClick={() => setSelectedTab('HIDDEN')}
          style={{
            background: '#ffffff',
            border: selectedTab === 'HIDDEN' ? '2px solid #64748b' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Đã ẩn</span>
            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>● Tạm ẩn</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#475569' }}>{stats.hidden.toLocaleString('vi-VN')}</div>
        </div>

        <div
          onClick={() => setSelectedTab('REJECTED')}
          style={{
            background: '#ffffff',
            border: selectedTab === 'REJECTED' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '12px 16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Từ chối / Vi phạm</span>
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>⚠ Vi phạm</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{stats.rejected.toLocaleString('vi-VN')}</div>
        </div>
      </div>

      {/* 3. TOOLBAR SEARCH & FILTERS (REQ 5) */}
      <div className="dashboard-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
          {/* SEARCH INPUT */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '7px 12px', width: 350, gap: 8 }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, ID tin, người bán..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: '#0f172a' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={14} color="#888" />
              </button>
            )}
          </div>

          {/* CATEGORY DROPDOWN */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', color: '#0f172a', outline: 'none', fontWeight: 500 }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* TIME DROPDOWN */}
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, background: '#ffffff', color: '#0f172a', outline: 'none', fontWeight: 500 }}
          >
            <option value="ALL">Tất cả thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="7D">7 ngày qua</option>
            <option value="30D">30 ngày qua</option>
          </select>

          {/* FILTER CLEAR LINK */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={14} /> Xóa bộ lọc ({activeFilterCount})
            </button>
          )}
        </div>

        <button
          onClick={onRefresh}
          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* 4. QUICK STATUS TABS (REQ 6) */}
      <div style={{ borderBottom: '2px solid #e2e8f0', display: 'flex', gap: 24, padding: '0 8px' }}>
        <button
          onClick={() => setSelectedTab('ALL')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'ALL' ? '3px solid #00a65a' : '3px solid transparent',
            color: selectedTab === 'ALL' ? '#00a65a' : '#64748b',
            fontWeight: selectedTab === 'ALL' ? 700 : 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Tất cả ({stats.total})
        </button>

        <button
          onClick={() => setSelectedTab('PENDING')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'PENDING' ? '3px solid #f59e0b' : '3px solid transparent',
            color: selectedTab === 'PENDING' ? '#d97706' : '#64748b',
            fontWeight: selectedTab === 'PENDING' ? 700 : 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Chờ duyệt ({stats.pending})
        </button>

        <button
          onClick={() => setSelectedTab('ACTIVE')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'ACTIVE' ? '3px solid #00a65a' : '3px solid transparent',
            color: selectedTab === 'ACTIVE' ? '#00a65a' : '#64748b',
            fontWeight: selectedTab === 'ACTIVE' ? 700 : 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Đang hiển thị ({stats.active})
        </button>

        <button
          onClick={() => setSelectedTab('HIDDEN')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'HIDDEN' ? '3px solid #64748b' : '3px solid transparent',
            color: selectedTab === 'HIDDEN' ? '#0f172a' : '#64748b',
            fontWeight: selectedTab === 'HIDDEN' ? 700 : 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Đã ẩn ({stats.hidden})
        </button>

        <button
          onClick={() => setSelectedTab('REJECTED')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: selectedTab === 'REJECTED' ? '3px solid #ef4444' : '3px solid transparent',
            color: selectedTab === 'REJECTED' ? '#dc2626' : '#64748b',
            fontWeight: selectedTab === 'REJECTED' ? 700 : 600,
            fontSize: 14,
            padding: '10px 0',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Từ chối / Vi phạm ({stats.rejected})
        </button>
      </div>

      {/* FLOATING BULK ACTIONS BAR (REQ 16) */}
      {selectedIds.length > 0 && (
        <div style={{ background: '#0f172a', color: '#ffffff', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Đã chọn <b>{selectedIds.length}</b> tin đăng</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleBulkApprove} style={{ background: '#00a65a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} /> Duyệt hàng loạt
            </button>
            <button onClick={handleBulkHide} style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <EyeOff size={14} /> Ẩn hàng loạt
            </button>
            <button onClick={handleBulkDelete} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} /> Xóa hàng loạt
            </button>
          </div>
        </div>
      )}

      {/* 5. REDESIGNED COMPACT TABLE (REQ 7 - 14) */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10, borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ width: 40, padding: '12px 16px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={paginatedPosts.length > 0 && selectedIds.length === paginatedPosts.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', minWidth: 280 }}>Tin đăng</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Người bán</th>
                <th
                  onClick={() => {
                    setSortField('price');
                    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  }}
                  style={{ padding: '12px 16px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Giá <ArrowUpDown size={13} color="#64748b" />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Danh mục</th>
                <th
                  onClick={() => {
                    setSortField('created_at');
                    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  }}
                  style={{ padding: '12px 16px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ngày đăng <ArrowUpDown size={13} color="#64748b" />
                  </div>
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', minWidth: 130 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {paginatedPosts.length > 0 ? (
                paginatedPosts.map(p => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        height: 72,
                        borderBottom: '1px solid #f1f5f9',
                        background: isChecked ? '#f0fdf4' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* CHECKBOX */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(p.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* TIN ĐĂNG (THUMBNAIL + TITLE + ID) */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={p.image_url || '/assets/product-1.jpg'}
                            alt=""
                            style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 280 }}>
                            <span
                              style={{
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#0f172a',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {p.title}
                            </span>
                            <span
                              onClick={() => {
                                navigator.clipboard?.writeText(p.id);
                                onToast('Đã sao chép mã tin!');
                              }}
                              style={{ fontSize: 11.5, color: '#94a3b8', cursor: 'pointer', fontFamily: 'monospace' }}
                              title="Nhấp để sao chép ID"
                            >
                              #{p.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* NGƯỜI BÁN */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{p.seller_name}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{p.seller_email}</div>
                      </td>

                      {/* GIÁ */}
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669', fontSize: 14 }}>
                        {formatVnd(p.price)}
                      </td>

                      {/* DANH MỤC */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>
                          {p.category_name}
                        </span>
                      </td>

                      {/* NGÀY ĐĂNG */}
                      <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#0f172a' }}>
                        <div>{new Date(p.created_at).toLocaleDateString('vi-VN')}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(p.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* TRẠNG THÁI */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: p.status === 'ACTIVE' ? '#d1fae5' : p.status === 'PENDING' ? '#fef3c7' : p.status === 'HIDDEN' ? '#f1f5f9' : '#fee2e2',
                            color: p.status === 'ACTIVE' ? '#059669' : p.status === 'PENDING' ? '#d97706' : p.status === 'HIDDEN' ? '#475569' : '#dc2626'
                          }}
                        >
                          {p.status === 'ACTIVE' ? '● Đã duyệt' : p.status === 'PENDING' ? '● Chờ duyệt' : p.status === 'HIDDEN' ? '● Đã ẩn' : '⚠ Từ chối'}
                        </span>
                      </td>

                      {/* THAO TÁC COMPACT */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
                          <button
                            onClick={() => setQuickViewPost(p)}
                            style={{ background: '#f1f5f9', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                            title="Xem nhanh"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => onSaveEdit(p.id, p)}
                            style={{ background: '#e0f2fe', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: '#0284c7' }}
                            title="Chỉnh sửa"
                          >
                            <Edit size={15} />
                          </button>

                          {/* MORE ACTIONS DROPDOWN */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                              style={{ background: '#f1f5f9', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                              title="Khác"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {openMenuId === p.id && (
                              <div
                                ref={menuRef}
                                style={{
                                  position: 'absolute',
                                  top: 'calc(100% + 4px)',
                                  right: 0,
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 12,
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                  width: 170,
                                  zIndex: 9999,
                                  padding: '6px 0',
                                  textAlign: 'left',
                                  fontSize: 12.5
                                }}
                              >
                                <div onClick={() => { setQuickViewPost(p); setOpenMenuId(null); }} style={{ padding: '8px 14px', cursor: 'pointer', color: '#334155', fontWeight: 500 }}>
                                  👁 Xem chi tiết
                                </div>

                                {p.status === 'PENDING' && (
                                  <div onClick={() => { onApprove(p.id); setOpenMenuId(null); }} style={{ padding: '8px 14px', cursor: 'pointer', color: '#059669', fontWeight: 600 }}>
                                    ✓ Duyệt tin
                                  </div>
                                )}

                                {p.status === 'HIDDEN' ? (
                                  <div onClick={() => { onUnhide(p.id); setOpenMenuId(null); }} style={{ padding: '8px 14px', cursor: 'pointer', color: '#059669', fontWeight: 600 }}>
                                    👁️‍🗨️ Hiện lại
                                  </div>
                                ) : (
                                  <div onClick={() => { onHide(p.id); setOpenMenuId(null); }} style={{ padding: '8px 14px', cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
                                    👁️‍🗨️ Ẩn tin
                                  </div>
                                )}

                                <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                                <div onClick={() => { setDeletingPost(p); setOpenMenuId(null); }} style={{ padding: '8px 14px', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
                                  🗑️ Xóa tin đăng
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* EMPTY STATE (REQ 19) */
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <FileText size={42} color="#cbd5e1" />
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Không tìm thấy tin đăng</h4>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} style={{ background: '#00a65a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. PAGINATION FOOTER (REQ 18) */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#f8fafc', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            Hiển thị <b>{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, totalItems)}</b> trong tổng <b>{totalItems.toLocaleString('vi-VN')}</b> tin đăng
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 600, color: '#334155', outline: 'none' }}
            >
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', width: 32, height: 32, borderRadius: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', padding: '0 8px' }}>
                Trang {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', width: 32, height: 32, borderRadius: 6, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK VIEW SLIDE-OVER DRAWER */}
      <ListingQuickViewDrawer
        post={quickViewPost}
        isOpen={!!quickViewPost}
        onClose={() => setQuickViewPost(null)}
        onApprove={onApprove}
        onUnhide={onUnhide}
        onHide={onHide}
        onEdit={p => setEditingPost(p)}
        onDelete={id => onDelete(id)}
        onToast={onToast}
      />

      {/* EDIT POST MODAL */}
      <EditListingModal
        isOpen={!!editingPost}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={form => {
          if (editingPost) {
            onSaveEdit(editingPost.id, form);
            setEditingPost(null);
          }
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteListingModal
        isOpen={!!deletingPost}
        postTitle={deletingPost?.title}
        onClose={() => setDeletingPost(null)}
        onConfirm={() => {
          if (deletingPost) {
            onDelete(deletingPost.id);
            setDeletingPost(null);
          }
        }}
      />
    </div>
  );
}
