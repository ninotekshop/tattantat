'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Users, FolderTree, ShoppingCart,
  CreditCard, Megaphone, BarChart3, Settings, Bell, Search,
  ChevronDown, TrendingUp, DollarSign, PackageCheck, ShieldAlert,
  Calendar, ExternalLink, Activity, Clock, Image as ImageIcon,
  Edit, Trash2, Plus, Code, Save, RotateCcw, Upload, CheckCircle,
  X, Filter, Eye, RefreshCw, AlertTriangle, ShieldCheck, UserCheck, Check, XCircle, Menu
} from 'lucide-react';
import '../admin.css';

interface DashboardData {
  kpis: {
    activeListings: number;
    activeListingsTrend: number;
    newUsers: number;
    newUsersTrend: number;
    completedOrders: number;
    completedOrdersTrend: number;
    totalRevenue: string;
    revenueTrend: number;
  };
  actionRequired: {
    pendingPosts: number;
    pendingReports: number;
    failedTransactions: number;
    pendingVerifications: number;
  };
  categories: { category_id: string; category_name: string; count: number }[];
  latestPosts: { id: string; title: string; price: string; status: string; image_url: string; category_name: string; created_at: string }[];
  latestOrders: { id: string; order_code: string; total_amount: string; order_status: string; payment_status: string; buyer_name: string; created_at: string }[];
  recentActivities: { id: string; actor_name: string; action: string; entity_type: string; created_at: string }[];
}

interface BannerItem {
  id: string;
  code?: string;
  title: string;
  imageUrl: string;
  position: string;
  targetUrl: string;
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

interface PostItem {
  id: string;
  title: string;
  price: string;
  status: string;
  image_url: string;
  category_name: string;
  seller_name: string;
  seller_email: string;
  created_at: string;
}

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  verification_status: string;
  posts_count: number;
  orders_count: number;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_code: string;
  total_amount: string;
  order_status: string;
  payment_status: string;
  payment_method?: string;
  buyer_name: string;
  seller_name: string;
  created_at: string;
}

interface ReportItem {
  id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  reporter_name: string;
  reported_user_name: string;
  product_id: string;
  product_title: string;
}

function formatVnd(val: string | number) {
  const num = typeof val === 'number' ? val : parseInt(val || '0', 10);
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState('tong-quan');
  const [dateRange, setDateRange] = useState('30 ngày');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: any[]; users: any[]; orders: any[] }>({ posts: [], users: [], orders: [] });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // DASHBOARD STATE
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // POSTS MODULE STATE
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postStatusFilter, setPostStatusFilter] = useState<string>('');
  const [postSearch, setPostSearch] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Nội dung không phù hợp quy định');

  // USERS MODULE STATE
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('Vi phạm tiêu chuẩn cộng đồng');

  // BANNERS MODULE STATE
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [formBanner, setFormBanner] = useState<{ title: string; position: string; imageUrl: string; targetUrl: string; expiryDate: string; status: 'ACTIVE' | 'INACTIVE' }>({
    title: '',
    position: 'Hero Banner (Trang chủ)',
    imageUrl: '',
    targetUrl: '/',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
  });

  // ORDERS MODULE STATE
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');

  // REPORTS MODULE STATE
  const [reports, setReports] = useState<ReportItem[]>([]);

  // CSS EDITOR STATE
  const cssFiles = [
    { key: 'dog-theme.css', label: 'dog-theme.css (Chủ đề & Trang chủ Marketplace)', note: 'Chứa CSS cho Form tìm kiếm, Banner, Danh mục, Product Grid, Product Card & Footer' },
    { key: 'admin.css', label: 'admin.css (Trang Quản trị Admin Console)', note: 'Chứa CSS cho Sidebar Admin, Topbar, KPI Cards, Bảng dữ liệu' },
    { key: 'globals.css', label: 'globals.css (Định dạng toàn cục & Reset CSS)', note: 'Chứa CSS quy định phông chữ toàn cục, biến màu sắc và reset' },
    { key: 'marketplace.css', label: 'marketplace.css (Cấu trúc Marketplace & Chi tiết sản phẩm)', note: 'Chứa CSS bố cục tổng thể và trang Chi tiết sản phẩm' },
    { key: 'member.css', label: 'member.css (Trang Tài khoản & Thành viên)', note: 'Chứa CSS cho trang Đăng nhập, Đăng ký, Quản lý tài khoản' },
  ];
  const [selectedCssFile, setSelectedCssFile] = useState('dog-theme.css');
  const [cssCode, setCssCode] = useState('/* Đang tải nội dung CSS... */');
  const [cssLoading, setCssLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // FETCH DASHBOARD DATA
  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    const rangeParam = dateRange === 'Hôm nay' ? 'today' : dateRange === '7 ngày' ? '7d' : '30d';
    fetch(`/api/v1/admin/dashboard?range=${rangeParam}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setDashboard(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateRange]);

  // FETCH POSTS
  const fetchPostsData = useCallback(() => {
    setLoading(true);
    const url = `/api/v1/admin/posts?status=${postStatusFilter}&q=${encodeURIComponent(postSearch)}`;
    fetch(url)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setPosts(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postStatusFilter, postSearch]);

  // FETCH USERS
  const fetchUsersData = useCallback(() => {
    setLoading(true);
    const url = `/api/v1/admin/users?status=${userStatusFilter}&q=${encodeURIComponent(userSearch)}`;
    fetch(url)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setUsers(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userStatusFilter, userSearch]);

  // FETCH BANNERS
  const fetchBannersData = useCallback(() => {
    fetch('/api/v1/admin/banners')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setBanners(res.data);
      })
      .catch(() => {});
  }, []);

  // FETCH ORDERS
  const fetchOrdersData = useCallback(() => {
    setLoading(true);
    fetch(`/api/v1/admin/orders?status=${orderStatusFilter}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setOrders(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderStatusFilter]);

  // FETCH REPORTS
  const fetchReportsData = useCallback(() => {
    setLoading(true);
    fetch('/api/v1/admin/reports')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setReports(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeNav === 'tong-quan') fetchDashboardData();
    else if (activeNav === 'tin-dang') fetchPostsData();
    else if (activeNav === 'nguoi-dung') fetchUsersData();
    else if (activeNav === 'banners') fetchBannersData();
    else if (activeNav === 'don-hang') fetchOrdersData();
    else if (activeNav === 'reports') fetchReportsData();
  }, [activeNav, fetchDashboardData, fetchPostsData, fetchUsersData, fetchBannersData, fetchOrdersData, fetchReportsData]);

  // GLOBAL SEARCH SHORTCUT & COMMAND PALETTE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setBannerModalOpen(false);
        setRejectModalOpen(false);
        setSuspendModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      fetch(`/api/v1/admin/search?q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) setSearchResults(res.data);
        })
        .catch(() => {});
    } else {
      setSearchResults({ posts: [], users: [], orders: [] });
    }
  }, [searchQuery]);

  // CSS EDITOR EFFECTS
  useEffect(() => {
    if (activeNav === 'css-editor') {
      setCssLoading(true);
      fetch(`/api/v1/admin/css?file=${selectedCssFile}`)
        .then(r => r.json())
        .then(data => {
          if (data.content) setCssCode(data.content);
        })
        .catch(() => setToast('Không thể đọc file CSS'))
        .finally(() => setCssLoading(false));
    }
  }, [selectedCssFile, activeNav]);

  const handleSaveCss = () => {
    setCssLoading(true);
    fetch('/api/v1/admin/css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: selectedCssFile, content: cssCode }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast(`Đã lưu giao diện CSS ${selectedCssFile} thành công!`);
        } else {
          showToast('Lỗi khi lưu file CSS');
        }
      })
      .catch(() => showToast('Lỗi kết nối khi lưu CSS'))
      .finally(() => setCssLoading(false));
  };

  // POST ACTIONS
  const handleApprovePost = (id: string) => {
    fetch(`/api/v1/admin/posts/${id}/approve`, { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã duyệt tin đăng thành công!');
          fetchPostsData();
          fetchDashboardData();
        } else {
          showToast(res.message || 'Lỗi khi duyệt tin đăng');
        }
      });
  };

  const handleRejectPost = () => {
    if (!rejectPostId) return;
    fetch(`/api/v1/admin/posts/${rejectPostId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã từ chối tin đăng!');
          setRejectModalOpen(false);
          fetchPostsData();
          fetchDashboardData();
        } else {
          showToast(res.message || 'Lỗi khi từ chối tin');
        }
      });
  };

  const handleHidePost = (id: string) => {
    fetch(`/api/v1/admin/posts/${id}/hide`, { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã ẩn tin đăng!');
          fetchPostsData();
        }
      });
  };

  // USER ACTIONS
  const handleSuspendUser = () => {
    if (!suspendUserId) return;
    fetch(`/api/v1/admin/users/${suspendUserId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: suspendReason }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã khóa tài khoản người dùng!');
          setSuspendModalOpen(false);
          fetchUsersData();
        }
      });
  };

  const handleUnsuspendUser = (id: string) => {
    fetch(`/api/v1/admin/users/${id}/unsuspend`, { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã mở khóa tài khoản người dùng!');
          fetchUsersData();
        }
      });
  };

  const handleVerifyUser = (id: string) => {
    fetch(`/api/v1/admin/users/${id}/verify`, { method: 'POST' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã xác minh tài khoản người dùng!');
          fetchUsersData();
        }
      });
  };

  // BANNER ACTIONS
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setFormBanner({
      title: '',
      position: 'Hero Banner (Trang chủ)',
      imageUrl: '/assets/banner_right.png',
      targetUrl: '/sell',
      expiryDate: '2026-12-31',
      status: 'ACTIVE',
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setFormBanner({
      title: b.title,
      position: b.position,
      imageUrl: b.imageUrl,
      targetUrl: b.targetUrl,
      expiryDate: b.expiryDate,
      status: b.status === 'EXPIRED' ? 'INACTIVE' : b.status,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = () => {
    if (!formBanner.title || !formBanner.imageUrl) {
      alert('Vui lòng chọn hoặc tải ảnh banner!');
      return;
    }
    const method = editingBanner ? 'PATCH' : 'POST';
    const url = editingBanner ? `/api/v1/admin/banners/${editingBanner.id}` : '/api/v1/admin/banners';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formBanner),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast(editingBanner ? 'Đã cập nhật Banner thành công!' : 'Đã tạo Banner mới!');
          setBannerModalOpen(false);
          fetchBannersData();
        } else {
          showToast(res.message || 'Lỗi khi lưu Banner');
        }
      });
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Banner này khỏi hệ thống?`)) {
      fetch(`/api/v1/admin/banners/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            showToast('Đã xóa Banner!');
            fetchBannersData();
          }
        });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setFormBanner(prev => ({
          ...prev,
          imageUrl: dataUrl,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '')
        }));
        showToast('Đã tải ảnh banner từ máy tính lên!');
      };
      reader.readAsDataURL(file);
    }
  };

  // REPORT RESOLVE ACTIONS
  const handleResolveReport = (reportId: string, action: 'RESOLVE' | 'HIDE') => {
    const url = action === 'HIDE' ? `/api/v1/admin/reports/${reportId}/hide-product` : `/api/v1/admin/reports/${reportId}`;
    const method = action === 'HIDE' ? 'POST' : 'PATCH';
    const body = action === 'HIDE' ? { note: 'Đã ẩn tin đăng vi phạm' } : { status: 'RESOLVED', note: 'Đã xử lý báo cáo' };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast(action === 'HIDE' ? 'Đã ẩn tin vi phạm và đóng báo cáo!' : 'Đã đóng báo cáo vi phạm!');
          fetchReportsData();
          fetchDashboardData();
        }
      });
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {toast && (
        <div style={{position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', zIndex:9999, fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8}}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* REJECT POST MODAL */}
      {rejectModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setRejectModalOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:480, padding:24, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e => e.stopPropagation()}>
            <h3 style={{margin:'0 0 16px', fontSize:18, fontWeight:700, color:'#0f172a'}}>Từ chối tin đăng</h3>
            <label style={{display:'block', fontSize:13, fontWeight:600, color:'#334155', marginBottom:6}}>Lý do từ chối *</label>
            <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14, marginBottom:16}}>
              <option value="Nội dung không phù hợp quy định">Nội dung không phù hợp quy định</option>
              <option value="Sai danh mục sản phẩm">Sai danh mục sản phẩm</option>
              <option value="Hình ảnh mờ, không rõ sản phẩm">Hình ảnh mờ, không rõ sản phẩm</option>
              <option value="Giá đăng bất hợp lý hoặc giả mạo">Giá đăng bất hợp lý hoặc giả mạo</option>
              <option value="Sản phẩm thuộc danh mục cấm giao dịch">Sản phẩm thuộc danh mục cấm giao dịch</option>
            </select>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
              <button onClick={() => setRejectModalOpen(false)} style={{padding:'8px 16px', borderRadius:8, border:'1px solid #cbd5e1', background:'#f8fafc', color:'#475569', fontWeight:600, cursor:'pointer'}}>Hủy</button>
              <button onClick={handleRejectPost} style={{padding:'8px 20px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, cursor:'pointer'}}>Xác nhận Từ chối</button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND USER MODAL */}
      {suspendModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setSuspendModalOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:480, padding:24, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e => e.stopPropagation()}>
            <h3 style={{margin:'0 0 16px', fontSize:18, fontWeight:700, color:'#0f172a'}}>Tạm khóa tài khoản người dùng</h3>
            <label style={{display:'block', fontSize:13, fontWeight:600, color:'#334155', marginBottom:6}}>Lý do tạm khóa *</label>
            <select value={suspendReason} onChange={e => setSuspendReason(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14, marginBottom:16}}>
              <option value="Vi phạm tiêu chuẩn cộng đồng">Vi phạm tiêu chuẩn cộng đồng</option>
              <option value="Đăng tin gian lận hoặc nghi vấn lừa đảo">Đăng tin gian lận hoặc nghi vấn lừa đảo</option>
              <option value="Nhận nhiều báo cáo vi phạm từ người mua">Nhận nhiều báo cáo vi phạm từ người mua</option>
              <option value="Tài khoản giả mạo hoặc spam">Tài khoản giả mạo hoặc spam</option>
            </select>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
              <button onClick={() => setSuspendModalOpen(false)} style={{padding:'8px 16px', borderRadius:8, border:'1px solid #cbd5e1', background:'#f8fafc', color:'#475569', fontWeight:600, cursor:'pointer'}}>Hủy</button>
              <button onClick={handleSuspendUser} style={{padding:'8px 20px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, cursor:'pointer'}}>Xác nhận Tạm khóa</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER ADD/EDIT MODAL */}
      {bannerModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setBannerModalOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:560, padding:24, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, borderBottom:'1px solid #e2e8f0', paddingBottom:12}}>
              <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0f172a'}}>{editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h3>
              <button onClick={() => setBannerModalOpen(false)} style={{background:'transparent', border:'none', cursor:'pointer'}}><X size={20} color="#64748b" /></button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Tên Banner *</label>
                <input type="text" value={formBanner.title} onChange={e => setFormBanner({...formBanner, title:e.target.value})} placeholder="Ví dụ: Banner Quảng cáo Trái/Phải" style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
              </div>

              <div>
                <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Vị trí hiển thị *</label>
                <select value={formBanner.position} onChange={e => setFormBanner({...formBanner, position:e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}}>
                  <option value="Hero Banner (Trang chủ)">Hero Banner (Trang chủ)</option>
                  <option value="Floating Left Banner (Mép ngoài trái)">Floating Left Banner (Mép ngoài trái)</option>
                  <option value="Floating Right Banner (Mép ngoài phải)">Floating Right Banner (Mép ngoài phải)</option>
                  <option value="Sidebar Banner (Cột phải)">Sidebar Banner (Cột phải)</option>
                  <option value="Category Banner">Category Banner (Trang danh mục)</option>
                </select>
              </div>

              <div style={{background:'#f8fafc', padding:14, borderRadius:10, border:'1px dashed #cbd5e1'}}>
                <label style={{fontSize:13, fontWeight:700, marginBottom:6, color:'#0f172a', display:'flex', alignItems:'center', gap:6}}>
                  <Upload size={16} color="#00a65a" /> Tải ảnh Banner từ máy tính
                </label>
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{fontSize:13, cursor:'pointer', width:'100%'}} />
                {formBanner.imageUrl && (
                  <div style={{marginTop:10, textAlign:'center'}}>
                    <div style={{fontSize:11, color:'#64748b', marginBottom:4}}>Xem trước hình ảnh:</div>
                    <img src={formBanner.imageUrl} alt="Preview" style={{maxHeight:100, maxWidth:'100%', borderRadius:8, border:'1px solid #e2e8f0', objectFit:'contain'}} />
                  </div>
                )}
              </div>

              <div>
                <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Hoặc nhập đường dẫn ảnh (Image URL)</label>
                <input type="text" value={formBanner.imageUrl} onChange={e => setFormBanner({...formBanner, imageUrl:e.target.value})} placeholder="/assets/banner_right.png" style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
              </div>

              <div>
                <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Liên kết khi click (Target URL)</label>
                <input type="text" value={formBanner.targetUrl} onChange={e => setFormBanner({...formBanner, targetUrl:e.target.value})} placeholder="/sell" style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Thời hạn tồn tại (Hạn chót)</label>
                  <input type="date" value={formBanner.expiryDate} onChange={e => setFormBanner({...formBanner, expiryDate:e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
                </div>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Trạng thái</label>
                  <select value={formBanner.status} onChange={e => setFormBanner({...formBanner, status:e.target.value as 'ACTIVE' | 'INACTIVE'})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}}>
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="INACTIVE">Tạm ẩn</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:24}}>
              <button onClick={() => setBannerModalOpen(false)} style={{padding:'8px 16px', borderRadius:8, border:'1px solid #cbd5e1', background:'#f8fafc', color:'#475569', fontWeight:600, cursor:'pointer'}}>Hủy</button>
              <button onClick={handleSaveBanner} style={{padding:'8px 20px', borderRadius:8, border:'none', background:'#00a65a', color:'#fff', fontWeight:600, cursor:'pointer'}}>Lưu Banner</button>
            </div>
          </div>
        </div>
      )}

      {/* COMMAND PALETTE SEARCH MODAL */}
      {searchOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'10vh'}} onClick={() => setSearchOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:640, boxShadow:'0 20px 40px rgba(0,0,0,0.2)', overflow:'hidden'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e2e8f0', gap:12}}>
              <Search size={20} color="#64748b" />
              <input
                autoFocus
                type="text"
                placeholder="Nhập mã đơn hàng, ID tin đăng hoặc email người dùng..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{border:'none', outline:'none', fontSize:16, width:'100%', background:'transparent'}}
              />
              <span style={{background:'#e2e8f0', color:'#475569', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600}}>ESC</span>
            </div>
            <div style={{padding:20, maxHeight:400, overflowY:'auto', fontSize:14}}>
              {searchQuery.trim().length < 2 ? (
                <div style={{textAlign:'center', color:'#64748b'}}>Gợi ý: Nhập mã đơn hàng, ID tin đăng hoặc tên người dùng để tìm kiếm nhanh.</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:16}}>
                  {searchResults.posts.length > 0 && (
                    <div>
                      <div style={{fontWeight:700, fontSize:12, color:'#64748b', marginBottom:8, textTransform:'uppercase'}}>Tin đăng ({searchResults.posts.length})</div>
                      {searchResults.posts.map(p => (
                        <div key={p.id} onClick={() => { setActiveNav('tin-dang'); setPostSearch(p.title); setSearchOpen(false); }} style={{padding:'8px 12px', borderRadius:8, background:'#f8fafc', marginBottom:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                          <span style={{fontWeight:600, color:'#0f172a'}}>{p.title}</span>
                          <span style={{color:'#00a65a', fontWeight:700, fontSize:13}}>{formatVnd(p.price)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.users.length > 0 && (
                    <div>
                      <div style={{fontWeight:700, fontSize:12, color:'#64748b', marginBottom:8, textTransform:'uppercase'}}>Người dùng ({searchResults.users.length})</div>
                      {searchResults.users.map(u => (
                        <div key={u.id} onClick={() => { setActiveNav('nguoi-dung'); setUserSearch(u.full_name); setSearchOpen(false); }} style={{padding:'8px 12px', borderRadius:8, background:'#f8fafc', marginBottom:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                          <span style={{fontWeight:600, color:'#0f172a'}}>{u.full_name} ({u.email || u.phone})</span>
                          <span style={{fontSize:12, color:'#64748b'}}>{u.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.orders.length > 0 && (
                    <div>
                      <div style={{fontWeight:700, fontSize:12, color:'#64748b', marginBottom:8, textTransform:'uppercase'}}>Đơn hàng ({searchResults.orders.length})</div>
                      {searchResults.orders.map(o => (
                        <div key={o.id} onClick={() => { setActiveNav('don-hang'); setSearchOpen(false); }} style={{padding:'8px 12px', borderRadius:8, background:'#f8fafc', marginBottom:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                          <span style={{fontWeight:600, color:'#0f172a'}}>Mã đơn: #{o.order_code || o.id.slice(0,8)}</span>
                          <span style={{color:'#00a65a', fontWeight:700, fontSize:13}}>{formatVnd(o.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.posts.length === 0 && searchResults.users.length === 0 && searchResults.orders.length === 0 && (
                    <div style={{textAlign:'center', color:'#64748b', padding:20}}>Không tìm thấy kết quả phù hợp với "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-brand">
          <img src="/assets/logo.png" alt="Tất Tần Tật" />
          {!sidebarCollapsed && <span style={{fontWeight:700, fontSize:15, color:'#fff'}}>Admin Console</span>}
        </div>

        <nav className="admin-nav">
          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'8px 16px', letterSpacing:'0.5px'}}>TỔNG QUAN</div>
          <button className={`admin-nav-item ${activeNav === 'tong-quan' ? 'active' : ''}`} onClick={() => setActiveNav('tong-quan')}>
            <div className="admin-nav-left"><LayoutDashboard size={18} />{!sidebarCollapsed && <span>Tổng quan</span>}</div>
          </button>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>QUẢN LÝ</div>
          <button className={`admin-nav-item ${activeNav === 'tin-dang' ? 'active' : ''}`} onClick={() => setActiveNav('tin-dang')}>
            <div className="admin-nav-left"><FileText size={18} />{!sidebarCollapsed && <span>Quản lý tin đăng</span>}</div>
            {!sidebarCollapsed && dashboard?.actionRequired.pendingPosts ? (
              <span className="admin-badge amber">{dashboard.actionRequired.pendingPosts} chờ duyệt</span>
            ) : null}
          </button>

          <button className={`admin-nav-item ${activeNav === 'nguoi-dung' ? 'active' : ''}`} onClick={() => setActiveNav('nguoi-dung')}>
            <div className="admin-nav-left"><Users size={18} />{!sidebarCollapsed && <span>Quản lý người dùng</span>}</div>
          </button>

          <Link href="/admin/listing-templates" className={`admin-nav-item ${activeNav === 'danh-muc' ? 'active' : ''}`}>
            <div className="admin-nav-left"><FolderTree size={18} />{!sidebarCollapsed && <span>Quản lý danh mục</span>}</div>
          </Link>

          <button className={`admin-nav-item ${activeNav === 'don-hang' ? 'active' : ''}`} onClick={() => setActiveNav('don-hang')}>
            <div className="admin-nav-left"><ShoppingCart size={18} />{!sidebarCollapsed && <span>Quản lý đơn hàng</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'banners' ? 'active' : ''}`} onClick={() => setActiveNav('banners')}>
            <div className="admin-nav-left"><ImageIcon size={18} />{!sidebarCollapsed && <span>Quản lý Banner</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge green">{banners.length}</span>}
          </button>

          <button className={`admin-nav-item ${activeNav === 'reports' ? 'active' : ''}`} onClick={() => setActiveNav('reports')}>
            <div className="admin-nav-left"><ShieldAlert size={18} />{!sidebarCollapsed && <span>Báo cáo vi phạm</span>}</div>
            {!sidebarCollapsed && dashboard?.actionRequired.pendingReports ? (
              <span className="admin-badge danger">{dashboard.actionRequired.pendingReports}</span>
            ) : null}
          </button>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>GIAO DIỆN & TÀI CHÍNH</div>
          <button className={`admin-nav-item ${activeNav === 'css-editor' ? 'active' : ''}`} onClick={() => setActiveNav('css-editor')}>
            <div className="admin-nav-left"><Code size={18} />{!sidebarCollapsed && <span>Quản lý CSS / Giao diện</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'thanh-toan' ? 'active' : ''}`} onClick={() => setActiveNav('thanh-toan')}>
            <div className="admin-nav-left"><CreditCard size={18} />{!sidebarCollapsed && <span>Thanh toán & Giao dịch</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'quang-cao' ? 'active' : ''}`} onClick={() => setActiveNav('quang-cao')}>
            <div className="admin-nav-left"><Megaphone size={18} />{!sidebarCollapsed && <span>Quảng cáo</span>}</div>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank" className="admin-view-website">
            <ExternalLink size={16} /> {!sidebarCollapsed && <span>Xem website</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* TOPBAR */}
        <header className="admin-header">
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8}}>
              <Menu size={20} color="#334155" />
            </button>
            <div className="admin-search" onClick={() => setSearchOpen(true)} style={{cursor:'pointer'}}>
              <Search size={16} color="#64748b" />
              <span style={{color:'#64748b', fontSize:14, flex:1}}>Tìm kiếm tin đăng, người dùng, mã đơn hàng...</span>
              <span style={{background:'#e2e8f0', color:'#475569', padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600}}>Ctrl + K</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <button style={{background:'#f1f5f9', border:'none', width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor:'pointer'}}>
              <Bell size={18} color="#334155" />
              {dashboard?.actionRequired.pendingPosts ? (
                <span style={{position:'absolute', top:8, right:8, width:8, height:8, background:'#ef4444', borderRadius:'50%'}}></span>
              ) : null}
            </button>

            <div style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}}>
              <img src="/assets/product-1.jpg" alt="Admin" style={{width:38, height:38, borderRadius:'50%', objectFit:'cover'}} />
              <div>
                <div style={{fontSize:14, fontWeight:600, color:'#0f172a'}}>Super Admin</div>
                <div style={{fontSize:11, color:'#64748b'}}>Hệ thống Tất Tần Tật</div>
              </div>
              <ChevronDown size={14} color="#64748b" />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="admin-content">
          <div className="admin-page-header">
            <div className="admin-page-title">
              <h1>
                {activeNav === 'banners' ? 'Quản lý Banner hệ thống'
                  : activeNav === 'tin-dang' ? 'Quản lý Tin đăng Marketplace'
                  : activeNav === 'nguoi-dung' ? 'Quản lý Người dùng & Xác minh'
                  : activeNav === 'don-hang' ? 'Quản lý Đơn hàng'
                  : activeNav === 'reports' ? 'Báo cáo vi phạm & Moderation'
                  : activeNav === 'css-editor' ? 'Chỉnh sửa Giao diện CSS'
                  : 'Tổng quan hệ thống'}
              </h1>
              <p>
                {activeNav === 'banners' ? 'Thêm mới, tải ảnh từ máy tính, bật/tắt và quản lý thời hạn hiển thị của các Banner quảng cáo.'
                  : activeNav === 'tin-dang' ? 'Duyệt, từ chối, ẩn và quản lý danh sách tin đăng sản phẩm từ người bán.'
                  : activeNav === 'nguoi-dung' ? 'Quản lý danh sách thành viên, xác minh tài khoản và khóa tài khoản vi phạm.'
                  : activeNav === 'don-hang' ? 'Theo dõi danh sách đơn hàng mua bán và trạng thái giao dịch.'
                  : activeNav === 'reports' ? 'Xử lý các báo cáo vi phạm sản phẩm và người dùng từ cộng đồng.'
                  : activeNav === 'css-editor' ? 'Chỉnh sửa trực tiếp style CSS của các trang giao diện trong hệ thống Tất Tần Tật.'
                  : 'Theo dõi hoạt động và các công việc cần xử lý của Tất Tần Tật.'}
              </p>
            </div>

            <div className="admin-filters">
              {activeNav === 'tong-quan' && ['Hôm nay', '7 ngày', '30 ngày'].map((range) => (
                <button
                  key={range}
                  className={`admin-filter-btn ${dateRange === range ? 'active' : ''}`}
                  onClick={() => setDateRange(range)}
                >
                  {range}
                </button>
              ))}
              <button className="admin-filter-btn" onClick={() => { fetchDashboardData(); showToast('Đã làm mới dữ liệu!'); }}>
                <RefreshCw size={15} color="#64748b" /> Làm mới
              </button>
            </div>
          </div>

          {/* DASHBOARD OVERVIEW */}
          {activeNav === 'tong-quan' ? (
            <>
              {/* ACTION ITEMS NEEDED */}
              <div className="action-required-box">
                <div className="action-required-title">
                  <ShieldAlert size={18} color="#d97706" /> CẦN XỬ LÝ NGAY
                </div>
                <div className="action-chips-grid">
                  <div className="action-chip warning" onClick={() => { setActiveNav('tin-dang'); setPostStatusFilter('PENDING'); }}>
                    <strong>{dashboard?.actionRequired.pendingPosts || 0}</strong> Tin chờ duyệt
                  </div>
                  <div className="action-chip danger" onClick={() => setActiveNav('reports')}>
                    <strong>{dashboard?.actionRequired.pendingReports || 0}</strong> Báo cáo vi phạm
                  </div>
                  <div className="action-chip info" onClick={() => setActiveNav('thanh-toan')}>
                    <strong>{dashboard?.actionRequired.failedTransactions || 0}</strong> Giao dịch lỗi
                  </div>
                  <div className="action-chip success" onClick={() => { setActiveNav('nguoi-dung'); setUserStatusFilter('PENDING'); }}>
                    <strong>{dashboard?.actionRequired.pendingVerifications || 0}</strong> Tài khoản cần xác minh
                  </div>
                </div>
              </div>

              {/* KPI CARDS WITH REAL DATA */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Tổng tin đăng hoạt động</span>
                    <div className="kpi-icon green"><FileText size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? dashboard.kpis.activeListings.toLocaleString('vi-VN') : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.activeListingsTrend ? `+${dashboard.kpis.activeListingsTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Người dùng mới</span>
                    <div className="kpi-icon blue"><Users size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? dashboard.kpis.newUsers.toLocaleString('vi-VN') : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.newUsersTrend ? `+${dashboard.kpis.newUsersTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Đơn hàng hoàn thành</span>
                    <div className="kpi-icon purple"><PackageCheck size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? dashboard.kpis.completedOrders.toLocaleString('vi-VN') : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.completedOrdersTrend ? `+${dashboard.kpis.completedOrdersTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Doanh thu ước tính</span>
                    <div className="kpi-icon orange"><DollarSign size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? formatVnd(dashboard.kpis.totalRevenue) : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.revenueTrend ? `+${dashboard.kpis.revenueTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>
              </div>

              {/* CHARTS & CATEGORY BREAKDOWN */}
              <div className="dashboard-grid-2">
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Biểu đồ hoạt động ({dateRange})</h3>
                    <div style={{display:'flex', gap:16, fontSize:12, fontWeight:500, color:'#64748b'}}>
                      <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#10b981', borderRadius:'50%'}}></span> Tin đăng</span>
                      <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#3b82f6', borderRadius:'50%'}}></span> Người dùng</span>
                      <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#f97316', borderRadius:'50%'}}></span> Đơn hàng</span>
                    </div>
                  </div>
                  <div style={{height:240, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:12, border:'1px dashed #cbd5e1', color:'#64748b', fontSize:13}}>
                    📈 Thống kê tăng trưởng theo {dateRange} (Dữ liệu thời gian thực từ cơ sở dữ liệu)
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Tỷ lệ tin đăng theo danh mục</h3>
                  </div>
                  <div style={{padding:'10px 0'}}>
                    {dashboard?.categories && dashboard.categories.length > 0 ? (
                      <div style={{display:'flex', flexDirection:'column', gap:12}}>
                        {dashboard.categories.map((c, i) => (
                          <div key={i}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:600, color:'#334155', marginBottom:4}}>
                              <span>{c.category_name}</span>
                              <span>{c.count} tin</span>
                            </div>
                            <div style={{height:8, background:'#e2e8f0', borderRadius:4, overflow:'hidden'}}>
                              <div style={{height:'100%', background: i === 0 ? '#00a65a' : i === 1 ? '#3b82f6' : i === 2 ? '#f59e0b' : '#8b5cf6', width: `${Math.min(100, (c.count / (dashboard.kpis.activeListings || 1)) * 100)}%`}}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b'}}>Đang cập nhật phân bổ danh mục...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* LATEST POSTS & LATEST ORDERS TABLES */}
              <div className="dashboard-grid-2">
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Tin đăng mới nhất</h3>
                    <button onClick={() => setActiveNav('tin-dang')} style={{background:'transparent', border:'none', color:'#00a65a', fontWeight:600, cursor:'pointer'}}>Xem tất cả →</button>
                  </div>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Hình ảnh</th>
                          <th>Tiêu đề</th>
                          <th>Giá</th>
                          <th>Danh mục</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard?.latestPosts && dashboard.latestPosts.length > 0 ? (
                          dashboard.latestPosts.map(p => (
                            <tr key={p.id}>
                              <td><img src={p.image_url || '/assets/product-1.jpg'} alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                              <td style={{fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.title}</td>
                              <td>{formatVnd(p.price)}</td>
                              <td>{p.category_name}</td>
                              <td>
                                <span className={`status-badge ${p.status === 'ACTIVE' ? 'approved' : p.status === 'PENDING' ? 'pending' : 'danger'}`}>
                                  {p.status === 'ACTIVE' ? 'Đã duyệt' : p.status === 'PENDING' ? 'Chờ duyệt' : p.status}
                                </span>
                              </td>
                              <td>
                                {p.status === 'PENDING' ? (
                                  <div style={{display:'flex', gap:6}}>
                                    <button onClick={() => handleApprovePost(p.id)} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Duyệt</button>
                                    <button onClick={() => { setRejectPostId(p.id); setRejectModalOpen(true); }} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Từ chối</button>
                                  </div>
                                ) : (
                                  <button onClick={() => handleHidePost(p.id)} style={{background:'#f1f5f9', color:'#475569', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Ẩn</button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={6} style={{textAlign:'center', color:'#64748b'}}>Chưa có tin đăng mới.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Đơn hàng mới nhất</h3>
                    <button onClick={() => setActiveNav('don-hang')} style={{background:'transparent', border:'none', color:'#00a65a', fontWeight:600, cursor:'pointer'}}>Xem tất cả →</button>
                  </div>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Khách hàng</th>
                          <th>Tổng tiền</th>
                          <th>Thanh toán</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard?.latestOrders && dashboard.latestOrders.length > 0 ? (
                          dashboard.latestOrders.map(o => (
                            <tr key={o.id}>
                              <td style={{fontWeight:600}}>#{o.order_code || o.id.slice(0, 8)}</td>
                              <td>{o.buyer_name}</td>
                              <td>{formatVnd(o.total_amount)}</td>
                              <td>{o.payment_status || 'Thành công'}</td>
                              <td><span className="status-badge delivered">{o.order_status || 'COMPLETED'}</span></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} style={{textAlign:'center', color:'#64748b'}}>Chưa có đơn hàng gần đây.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* RECENT ACTIVITY LOG */}
              <div className="dashboard-card" style={{marginTop:24}}>
                <div className="card-header-flex">
                  <h3><Activity size={18} color="#00a65a" style={{marginRight:8, verticalAlign:'middle'}} /> Hoạt động gần đây (Audit Log)</h3>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
                    dashboard.recentActivities.map((log) => (
                      <div key={log.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', borderRadius:10, fontSize:13}}>
                        <div style={{display:'flex', alignItems:'center', gap:12}}>
                          <span style={{color:'#64748b', fontSize:12, fontWeight:600, background:'#e2e8f0', padding:'2px 6px', borderRadius:4}}>
                            <Clock size={11} style={{marginRight:3, verticalAlign:'middle'}} />
                            {new Date(log.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{color:'#1e293b', fontWeight:500}}>{log.action} ({log.entity_type})</span>
                        </div>
                        <span style={{color:'#64748b', fontSize:12}}>Bởi: <b>{log.actor_name || 'Super Admin'}</b></span>
                      </div>
                    ))
                  ) : (
                    <div style={{padding:16, textAlign:'center', color:'#64748b'}}>Chưa có nhật ký hoạt động gần đây.</div>
                  )}
                </div>
              </div>
            </>
          ) : activeNav === 'tin-dang' ? (
            /* POSTS MANAGEMENT MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{gap:12, flexWrap:'wrap'}}>
                <h3>Quản lý danh sách tin đăng</h3>
                <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, ID..."
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    style={{padding:'6px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13}}
                  />
                  <select
                    value={postStatusFilter}
                    onChange={e => setPostStatusFilter(e.target.value)}
                    style={{padding:'6px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13}}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="ACTIVE">Đã duyệt (Active)</option>
                    <option value="REJECTED">Đã từ chối</option>
                    <option value="HIDDEN">Tạm ẩn</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hình ảnh</th>
                      <th>Tiêu đề</th>
                      <th>Người bán</th>
                      <th>Giá</th>
                      <th>Danh mục</th>
                      <th>Ngày đăng</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.length > 0 ? (
                      posts.map(p => (
                        <tr key={p.id}>
                          <td><img src={p.image_url || '/assets/product-1.jpg'} alt="" style={{width:42, height:42, borderRadius:8, objectFit:'cover'}} /></td>
                          <td>
                            <div style={{fontWeight:600, color:'#0f172a'}}>{p.title}</div>
                            <div style={{fontSize:11, color:'#64748b'}}>ID: {p.id.slice(0, 8)}</div>
                          </td>
                          <td>
                            <div style={{fontSize:13, fontWeight:500}}>{p.seller_name}</div>
                            <div style={{fontSize:11, color:'#64748b'}}>{p.seller_email}</div>
                          </td>
                          <td style={{fontWeight:700, color:'#00a65a'}}>{formatVnd(p.price)}</td>
                          <td>{p.category_name}</td>
                          <td style={{fontSize:12, color:'#64748b'}}>{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`status-badge ${p.status === 'ACTIVE' ? 'approved' : p.status === 'PENDING' ? 'pending' : 'danger'}`}>
                              {p.status === 'ACTIVE' ? 'Đã duyệt' : p.status === 'PENDING' ? 'Chờ duyệt' : p.status === 'REJECTED' ? 'Đã từ chối' : 'Tạm ẩn'}
                            </span>
                          </td>
                          <td>
                            <div style={{display:'flex', gap:6}}>
                              {p.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleApprovePost(p.id)} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Duyệt</button>
                                  <button onClick={() => { setRejectPostId(p.id); setRejectModalOpen(true); }} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Từ chối</button>
                                </>
                              )}
                              {p.status === 'ACTIVE' && (
                                <button onClick={() => handleHidePost(p.id)} style={{background:'#f1f5f9', color:'#475569', border:'none', padding:'6px 12px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Ẩn tin</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={8} style={{textAlign:'center', color:'#64748b', padding:24}}>Không có tin đăng phù hợp.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'nguoi-dung' ? (
            /* USERS MANAGEMENT MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{gap:12, flexWrap:'wrap'}}>
                <h3>Quản lý thành viên hệ thống</h3>
                <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, SĐT..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    style={{padding:'6px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13}}
                  />
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value)}
                    style={{padding:'6px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13}}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="SUSPENDED">Đã tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Thành viên</th>
                      <th>Email / SĐT</th>
                      <th>Tin đăng</th>
                      <th>Đơn hàng</th>
                      <th>Xác minh</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map(u => (
                        <tr key={u.id}>
                          <td style={{fontWeight:600, color:'#0f172a'}}>{u.full_name || 'Thành viên'}</td>
                          <td>
                            <div style={{fontSize:13}}>{u.email || '—'}</div>
                            <div style={{fontSize:11, color:'#64748b'}}>{u.phone || ''}</div>
                          </td>
                          <td style={{fontWeight:600}}>{u.posts_count} tin</td>
                          <td style={{fontWeight:600}}>{u.orders_count} đơn</td>
                          <td>
                            <span className={`status-badge ${u.verification_status === 'VERIFIED' ? 'approved' : 'pending'}`}>
                              {u.verification_status === 'VERIFIED' ? '✓ Đã xác minh' : 'Chưa xác minh'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.status === 'SUSPENDED' ? 'danger' : 'approved'}`}>
                              {u.status === 'SUSPENDED' ? 'Đã khóa' : 'Hoạt động'}
                            </span>
                          </td>
                          <td>
                            <div style={{display:'flex', gap:6}}>
                              {u.verification_status !== 'VERIFIED' && (
                                <button onClick={() => handleVerifyUser(u.id)} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Xác minh</button>
                              )}
                              {u.status === 'SUSPENDED' ? (
                                <button onClick={() => handleUnsuspendUser(u.id)} style={{background:'#e0f2fe', color:'#0284c7', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Mở khóa</button>
                              ) : (
                                <button onClick={() => { setSuspendUserId(u.id); setSuspendModalOpen(true); }} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Khóa TK</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} style={{textAlign:'center', color:'#64748b', padding:24}}>Không tìm thấy thành viên.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'reports' ? (
            /* MODERATION REPORTS MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Báo cáo vi phạm từ người dùng</h3>
              </div>
              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Lý do</th>
                      <th>Chi tiết</th>
                      <th>Người báo cáo</th>
                      <th>Sản phẩm bị báo cáo</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length > 0 ? (
                      reports.map(r => (
                        <tr key={r.id}>
                          <td style={{fontWeight:600, color:'#dc2626'}}>{r.reason}</td>
                          <td style={{fontSize:13, maxWidth:200}}>{r.details || 'Không có chi tiết'}</td>
                          <td>{r.reporter_name}</td>
                          <td style={{fontWeight:600}}>{r.product_title || 'Sản phẩm'}</td>
                          <td style={{fontSize:12, color:'#64748b'}}>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <span className={`status-badge ${r.status === 'RESOLVED' ? 'approved' : 'pending'}`}>{r.status}</span>
                          </td>
                          <td>
                            {r.status !== 'RESOLVED' && (
                              <div style={{display:'flex', gap:6}}>
                                <button onClick={() => handleResolveReport(r.id, 'HIDE')} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Ẩn tin vi phạm</button>
                                <button onClick={() => handleResolveReport(r.id, 'RESOLVE')} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Đóng báo cáo</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} style={{textAlign:'center', color:'#64748b', padding:24}}>Chưa có báo cáo vi phạm cần xử lý.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'banners' ? (
            /* BANNERS MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Danh sách Banner quảng cáo & Hero ({banners.length})</h3>
                <button onClick={handleOpenAddBanner} style={{background:'#00a65a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                  <Plus size={16} /> Thêm Banner mới
                </button>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Xem trước</th>
                      <th>Tên Banner</th>
                      <th>Vị trí</th>
                      <th>Liên kết</th>
                      <th>Hạn hiển thị</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((b, idx) => (
                      <tr key={(b.id || idx) + '-' + idx}>
                        <td style={{fontWeight:600}}>{b.code || b.id.slice(0, 8)}</td>
                        <td><img src={b.imageUrl} alt="" style={{width:65, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                        <td style={{fontWeight:600}}>{b.title}</td>
                        <td>{b.position}</td>
                        <td><code style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:4, fontSize:12}}>{b.targetUrl}</code></td>
                        <td><span style={{fontSize:12, fontWeight:500, color:'#475569'}}>{b.expiryDate}</span></td>
                        <td>
                          {b.status === 'ACTIVE' ? (
                            <span className="status-badge approved">Đang hiển thị</span>
                          ) : (
                            <span className="status-badge pending">Tạm ẩn</span>
                          )}
                        </td>
                        <td>
                          <div style={{display:'flex', gap:6}}>
                            <button onClick={() => handleOpenEditBanner(b)} style={{background:'#f1f5f9', color:'#334155', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
                              <Edit size={13} /> Sửa
                            </button>
                            <button onClick={() => handleDeleteBanner(b.id)} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
                              <Trash2 size={13} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'don-hang' ? (
            /* ORDERS MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Danh sách đơn hàng</h3>
              </div>
              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Người mua</th>
                      <th>Người bán</th>
                      <th>Tổng tiền</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(o => (
                        <tr key={o.id}>
                          <td style={{fontWeight:600}}>#{o.order_code || o.id.slice(0, 8)}</td>
                          <td>{o.buyer_name}</td>
                          <td>{o.seller_name}</td>
                          <td style={{fontWeight:700, color:'#00a65a'}}>{formatVnd(o.total_amount)}</td>
                          <td>{o.payment_method || 'Chuyển khoản / COD'}</td>
                          <td><span className="status-badge delivered">{o.order_status || 'COMPLETED'}</span></td>
                          <td style={{fontSize:12, color:'#64748b'}}>{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} style={{textAlign:'center', color:'#64748b', padding:24}}>Chưa có đơn hàng trong hệ thống.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'css-editor' ? (
            /* CSS EDITOR MODULE */
            <div className="dashboard-card" style={{padding:20}}>
              <div style={{marginBottom:16}}>
                <label style={{display:'block', fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:8}}>Chọn trang / File CSS cần chỉnh sửa:</label>
                <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:12}}>
                  {cssFiles.map(file => (
                    <button
                      key={file.key}
                      onClick={() => setSelectedCssFile(file.key)}
                      style={{
                        padding:'8px 16px',
                        borderRadius:8,
                        border: selectedCssFile === file.key ? '2px solid #00a65a' : '1px solid #cbd5e1',
                        background: selectedCssFile === file.key ? '#e0f6e9' : '#fff',
                        color: selectedCssFile === file.key ? '#008247' : '#334155',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        display:'flex',
                        alignItems:'center',
                        gap:6
                      }}
                    >
                      <Code size={15} /> {file.key}
                    </button>
                  ))}
                </div>

                <div style={{background:'#f8fafc', padding:'10px 14px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, color:'#475569'}}>
                  <b>Ghi chú:</b> {cssFiles.find(f => f.key === selectedCssFile)?.note}
                </div>
              </div>

              <div style={{position:'relative', marginBottom:16}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'#1e293b', color:'#f8fafc', padding:'10px 16px', borderTopLeftRadius:10, borderTopRightRadius:10, fontSize:13, fontWeight:600}}>
                  <span>Editing: app/{selectedCssFile}</span>
                  {cssLoading && <span style={{fontSize:12, color:'#a7f3d0'}}>Đang xử lý...</span>}
                </div>
                <textarea
                  value={cssCode}
                  onChange={e => setCssCode(e.target.value)}
                  rows={20}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#38bdf8',
                    fontFamily: 'monospace, Consolas, Courier',
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    padding: 16,
                    borderBottomLeftRadius: 10,
                    borderBottomRightRadius: 10,
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <button
                  onClick={() => setSelectedCssFile(selectedCssFile)}
                  style={{background:'#f1f5f9', color:'#475569', border:'1px solid #cbd5e1', padding:'10px 18px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}
                >
                  <RotateCcw size={15} /> Tải lại nội dung cũ
                </button>

                <button
                  onClick={handleSaveCss}
                  disabled={cssLoading}
                  style={{background:'#00a65a', color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(0,166,90,0.3)'}}
                >
                  <Save size={16} /> Lưu & Áp dụng CSS
                </button>
              </div>
            </div>
          ) : (
            <div className="dashboard-card" style={{padding:40, textAlign:'center'}}>
              <h3>Đang phát triển module này</h3>
              <p style={{color:'#64748b', marginTop:8}}>Chức năng quản lý cho mục này đang được kết nối dữ liệu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
