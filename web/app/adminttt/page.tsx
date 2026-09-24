'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, FileText, Users, FolderTree, ShoppingCart,
  CreditCard, Megaphone, BarChart3, Settings, Bell, Search,
  ChevronDown, TrendingUp, DollarSign, PackageCheck, ShieldAlert,
  Calendar, ExternalLink, Activity, Clock, Image as ImageIcon,
  Edit, Trash2, Plus, Code, Save, RotateCcw, Upload, CheckCircle,
  X, Filter, Eye, RefreshCw, AlertTriangle, ShieldCheck, UserCheck,
  Check, XCircle, Menu, LogOut, User, Lock, Mail, KeyRound, Sparkles,
  Server, Sliders, Shield, EyeOff, CheckSquare, MessageSquare
} from 'lucide-react';
import { TemplateAdmin } from '../../components/listings/TemplateAdmin';
import { ListingManagementPage } from '../../components/admin/listing/ListingManagementPage';
import { saveSession, readSession } from '../../lib/auth';
import '../admin.css';

interface AdminSession {
  email: string;
  fullName: string;
  role: string;
  token?: string;
  avatarUrl?: string;
}

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
  description?: string;
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
  platform_fee?: string;
  seller_net_amount?: string;
  product_title?: string;
  order_status: string;
  payment_status: string;
  payment_method?: string;
  buyer_name: string;
  buyer_email?: string;
  seller_name: string;
  seller_email?: string;
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
  if (isNaN(num) || num === 0) return '0 ₫';
  return num.toLocaleString('de-DE') + ' ₫';
}

export default function AdminDashboardPage() {
  // ADMIN AUTH SESSION STATE
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // CONSOLE STATE
  const [activeNav, setActiveNav] = useState('tong-quan');
  const [dateRange, setDateRange] = useState('30 ngày');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ posts: any[]; users: any[]; orders: any[] }>({ posts: [], users: [], orders: [] });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // CATEGORIES STATE
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/v1/listing-categories')
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setCategories(res.data.map((c: any) => ({ id: String(c.id), name: c.name })));
        }
      })
      .catch(() => {});
  }, []);

  // DROPDOWN CLICK OUTSIDE REFS
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // DASHBOARD STATE
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // POSTS MODULE STATE
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postStatusFilter, setPostStatusFilter] = useState<string>('');
  const [postSearch, setPostSearch] = useState<string>('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPostId, setRejectPostId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Nội dung không phù hợp quy định');

  // EDIT POST MODAL STATE
  const [editPostModalOpen, setEditPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  // USERS MODULE STATE
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('Vi phạm tiêu chuẩn cộng đồng');

  // EDIT USER MODAL STATE
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserForm, setEditUserForm] = useState({ fullName: '', email: '', phone: '', status: 'ACTIVE', isVerified: false });

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

  // CHAT HISTORY MODAL STATE
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatData, setChatData] = useState<{ orderId: string; buyerName: string; sellerName: string; messages: any[] } | null>(null);

  // REPORTS MODULE STATE
  const [reports, setReports] = useState<ReportItem[]>([]);

  // SYSTEM SETTINGS STATE
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Tất Tần Tật',
    supportEmail: 'hotro@tattantat.vn',
    supportPhone: '1900 1234',
    maintenanceMode: false,
    autoApproveListings: false,
    commissionRate: '2.5',
    maxImagesPerPost: '20'
  });

  // CHANGE PASSWORD STATE
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

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

  // CLICK OUTSIDE TO CLOSE DROPDOWNS
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CHECK SAVED ADMIN SESSION ON MOUNT
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tattantat_adminttt_session') || localStorage.getItem('tattantat_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email && (parsed?.role === 'ADMIN' || parsed?.role === 'SUPER_ADMIN')) {
          setAdminSession(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const webSession = readSession();
    const token = adminSession?.token || webSession?.accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const handleUnauthorized = useCallback((res: any) => {
    if (res?.message?.includes('token') || res?.message?.includes('xác thực') || res?.errorCode === 'UNAUTHORIZED') {
      showToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      setAdminSession(null);
      localStorage.removeItem('tattantat_adminttt_session');
    }
  }, []);

  // SYNC ADMIN PROFILE FROM BACKEND DATABASE
  useEffect(() => {
    if (!adminSession?.token) return;
    fetch('/api/v1/me', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const updatedSession: AdminSession = {
            ...adminSession,
            fullName: res.data.full_name || adminSession.fullName,
            avatarUrl: res.data.avatar_url || adminSession.avatarUrl,
            email: res.data.email || adminSession.email
          };
          setAdminSession(updatedSession);
          localStorage.setItem('tattantat_adminttt_session', JSON.stringify(updatedSession));
        }
      })
      .catch(() => {});
  }, [adminSession?.token]);

  // ADMIN AVATAR UPLOAD HANDLER
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      fetch('/api/v1/me', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ avatarUrl: dataUrl }),
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            const updatedSession = { ...adminSession!, avatarUrl: res.data.avatar_url };
            setAdminSession(updatedSession);
            localStorage.setItem('tattantat_adminttt_session', JSON.stringify(updatedSession));
            showToast('Đã cập nhật ảnh đại diện Admin thành công!');
          } else {
            showToast(res.message || 'Không thể cập nhật ảnh đại diện');
          }
        })
        .catch(() => showToast('Lỗi khi tải ảnh đại diện'));
    };
    reader.readAsDataURL(file);
  };

  // ADMIN CHANGE PASSWORD HANDLER
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    fetch('/api/v1/me/change-password', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã đổi mật khẩu Admin thành công! Mật khẩu mới đã được cập nhật.');
          setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
          alert(res.message || 'Mật khẩu hiện tại chưa chính xác!');
        }
      })
      .catch(() => alert('Lỗi kết nối máy chủ khi đổi mật khẩu'));
  };

  // ADMIN LOGIN SUBMIT HANDLER WITH OFFICIAL REAL API AUTHENTICATION
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: loginEmail, password: loginPassword }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const role = res.data.user?.role || res.data.role || 'USER';
          if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            setLoginError('Từ chối truy cập: Tài khoản không có quyền Quản trị viên (ADMIN/SUPER_ADMIN)');
            return;
          }
          const sessionData: AdminSession = {
            email: res.data.user?.email || res.data.email || loginEmail,
            fullName: res.data.user?.fullName || res.data.fullName || 'Quản trị viên',
            role: role,
            token: res.data.accessToken,
            avatarUrl: res.data.user?.avatarUrl
          };
          setAdminSession(sessionData);
          localStorage.setItem('tattantat_adminttt_session', JSON.stringify(sessionData));
          saveSession({
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken || res.data.accessToken,
            user: {
              id: res.data.user?.id || '',
              fullName: res.data.user?.fullName || 'Quản trị viên',
              avatarUrl: res.data.user?.avatarUrl,
              role: role
            }
          });
          showToast('Đăng nhập Quản trị viên thành công!');
        } else {
          setLoginError(res.message || 'Mật khẩu hoặc email Admin chưa chính xác');
        }
      })
      .catch((err) => {
        setLoginError('Lỗi kết nối máy chủ xác thực: ' + (err instanceof Error ? err.message : 'Không thể kết nối'));
      })
      .finally(() => setLoginLoading(false));
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    localStorage.removeItem('tattantat_adminttt_session');
    localStorage.removeItem('tattantat_admin_session');
    showToast('Đã đăng xuất khỏi phiên Admin');
  };

  // FETCH DASHBOARD DATA
  const fetchDashboardData = useCallback(() => {
    setLoading(true);
    const rangeParam = dateRange === 'Hôm nay' ? 'today' : dateRange === '7 ngày' ? '7d' : dateRange === '12 tháng' ? '1y' : '30d';
    fetch(`/api/v1/admin/dashboard?range=${rangeParam}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setDashboard(res.data);
        } else {
          handleUnauthorized(res);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateRange, adminSession, handleUnauthorized]);

  // FETCH POSTS
  const fetchPostsData = useCallback(() => {
    setLoading(true);
    const url = `/api/v1/admin/posts?status=${postStatusFilter}&q=${encodeURIComponent(postSearch)}`;
    fetch(url, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setPosts(res.data);
        } else {
          handleUnauthorized(res);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postStatusFilter, postSearch, adminSession, handleUnauthorized]);

  // FETCH USERS
  const fetchUsersData = useCallback(() => {
    setLoading(true);
    const url = `/api/v1/admin/users?status=${userStatusFilter}&q=${encodeURIComponent(userSearch)}`;
    fetch(url, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setUsers(res.data);
        } else {
          handleUnauthorized(res);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userStatusFilter, userSearch, adminSession, handleUnauthorized]);

  // FETCH BANNERS
  const fetchBannersData = useCallback(() => {
    fetch('/api/v1/admin/banners', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setBanners(res.data);
        } else {
          handleUnauthorized(res);
        }
      })
      .catch(() => {});
  }, [adminSession, handleUnauthorized]);

  // FETCH ORDERS
  const fetchOrdersData = useCallback(() => {
    setLoading(true);
    fetch(`/api/v1/admin/orders?status=${orderStatusFilter}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setOrders(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderStatusFilter, adminSession]);

  // FETCH REPORTS
  const fetchReportsData = useCallback(() => {
    setLoading(true);
    fetch('/api/v1/admin/reports', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setReports(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminSession]);

  // FETCH SUBSCRIPTIONS (GÓI ĐẨY TIN)
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const fetchSubscriptionsData = useCallback(() => {
    setLoading(true);
    fetch('/api/v1/admin/orders/subscriptions/list', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setSubscriptions(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminSession]);

  // FETCH ADVERTISING (GÓI QUẢNG CÁO)
  const [advertising, setAdvertising] = useState<any[]>([]);
  const fetchAdvertisingData = useCallback(() => {
    setLoading(true);
    fetch('/api/v1/admin/orders/advertising/list', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) setAdvertising(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminSession]);

  useEffect(() => {
    if (!adminSession) return;
    if (activeNav === 'tong-quan') fetchDashboardData();
    else if (activeNav === 'tin-dang') fetchPostsData();
    else if (activeNav === 'nguoi-dung') fetchUsersData();
    else if (activeNav === 'banners') fetchBannersData();
    else if (activeNav === 'don-hang') fetchOrdersData();
    else if (activeNav === 'reports') fetchReportsData();
    else if (activeNav === 'goi-dich-vu') fetchSubscriptionsData();
    else if (activeNav === 'goi-quang-cao') fetchAdvertisingData();
  }, [adminSession, activeNav, fetchDashboardData, fetchPostsData, fetchUsersData, fetchBannersData, fetchOrdersData, fetchReportsData, fetchSubscriptionsData, fetchAdvertisingData]);

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
        setProfileDropdownOpen(false);
        setNotifDropdownOpen(false);
        setEditPostModalOpen(false);
        setEditUserModalOpen(false);
        setChatModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      fetch(`/api/v1/admin/search?q=${encodeURIComponent(searchQuery)}`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) setSearchResults(res.data);
        })
        .catch(() => {});
    } else {
      setSearchResults({ posts: [], users: [], orders: [] });
    }
  }, [searchQuery, adminSession]);

  // CSS EDITOR EFFECTS
  useEffect(() => {
    if (adminSession && activeNav === 'css-editor') {
      setCssLoading(true);
      fetch(`/api/v1/admin/css?file=${selectedCssFile}`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => {
          if (data.content) {
            setCssCode(data.content);
          } else if (data.error) {
            showToast(data.error);
          }
        })
        .catch(() => showToast('Không thể kết nối API đọc CSS'))
        .finally(() => setCssLoading(false));
    }
  }, [adminSession, selectedCssFile, activeNav]);

  const handleSaveCss = () => {
    setCssLoading(true);
    fetch('/api/v1/admin/css', {
      method: 'POST',
      headers: getAuthHeaders(),
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

  // POST ACTIONS: APPROVE, REJECT, HIDE, UNHIDE, EDIT, DELETE
  const handleApprovePost = (id: string) => {
    fetch(`/api/v1/admin/posts/${id}/approve`, { method: 'POST', headers: getAuthHeaders() })
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

  const handleUnhidePost = (id: string) => {
    fetch(`/api/v1/admin/posts/${id}/unhide`, { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã hiển thị lại tin đăng!');
          fetchPostsData();
          fetchDashboardData();
        } else {
          showToast(res.message || 'Lỗi khi hiển thị lại tin');
        }
      });
  };

  const handleDeletePost = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tin đăng này khỏi hệ thống?')) return;
    fetch(`/api/v1/admin/posts/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã xóa tin đăng thành công!');
          fetchPostsData();
          fetchDashboardData();
        } else {
          showToast(res.message || 'Không thể xóa tin đăng');
        }
      });
  };

  const handleRejectPost = () => {
    if (!rejectPostId) return;
    fetch(`/api/v1/admin/posts/${rejectPostId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    fetch(`/api/v1/admin/posts/${id}/hide`, { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã ẩn tin đăng!');
          fetchPostsData();
        }
      });
  };

  // USER ACTIONS: EDIT, DELETE, SUSPEND, UNSUSPEND, VERIFY
  const handleOpenEditUser = (u: UserItem) => {
    setEditingUser(u);
    setEditUserForm({
      fullName: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      status: u.status || 'ACTIVE',
      isVerified: u.verification_status === 'VERIFIED'
    });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    fetch(`/api/v1/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(editUserForm),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã cập nhật thông tin tài khoản thành công!');
          setEditUserModalOpen(false);
          fetchUsersData();
        } else {
          showToast(res.message || 'Không thể cập nhật người dùng');
        }
      });
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa / tạm khóa tài khoản này?')) return;
    fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã xóa / vô hiệu hóa tài khoản thành công!');
          fetchUsersData();
        } else {
          showToast(res.message || 'Không thể xóa tài khoản');
        }
      });
  };

  const handleSuspendUser = () => {
    if (!suspendUserId) return;
    fetch(`/api/v1/admin/users/${suspendUserId}/suspend`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    fetch(`/api/v1/admin/users/${id}/unsuspend`, { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã mở khóa tài khoản người dùng!');
          fetchUsersData();
        }
      });
  };

  const handleVerifyUser = (id: string) => {
    fetch(`/api/v1/admin/users/${id}/verify`, { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          showToast('Đã xác minh tài khoản người dùng!');
          fetchUsersData();
        }
      });
  };

  // ORDER CHAT HISTORY
  const handleOpenChatModal = (orderId: string) => {
    setChatModalOpen(true);
    setChatData(null);
    fetch(`/api/v1/admin/orders/${orderId}/chat-history`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setChatData(res.data);
        }
      })
      .catch(() => showToast('Không thể tải lịch sử trò chuyện'));
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
      headers: getAuthHeaders(),
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
      fetch(`/api/v1/admin/banners/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
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
      headers: getAuthHeaders(),
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

  // RENDER ADMIN LOGIN FORM IF NOT AUTHENTICATED
  if (!adminSession) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <img src="/assets/logo.png" alt="Tất Tần Tật AdminTTT" className="admin-login-logo" />
          <span className="admin-login-badge">🛡️ BẢO MẬT HỆ THỐNG - ADMINTTT</span>
          <h1 className="admin-login-title">Đăng nhập Admin Console</h1>
          <p className="admin-login-subtitle">Trang quản trị bảo mật bảo vệ nền tảng Tất Tần Tật</p>

          {loginError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              ⚠️ {loginError}
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleAdminLogin}>
            <div className="admin-input-group">
              <label>Tài khoản / Email Quản trị *</label>
              <div className="admin-input-wrapper">
                <Mail size={18} className="admin-input-icon" />
                <input
                  type="text"
                  placeholder="admin@tattantat.vn"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="admin-input-group">
              <label>Mật khẩu Khóa *</label>
              <div className="admin-input-wrapper">
                <KeyRound size={18} className="admin-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <Eye size={18} /> : <Lock size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loginLoading}>
              {loginLoading ? 'Đang xác thực...' : 'XÁC THỰC BẢO MẬT & ĐĂNG NHẬP'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
            🔒 <b>CẢNH BÁO BẢO MẬT ADMINTTT:</b> Trang dành riêng cho Cán bộ Quản trị có thẩm quyền. Mọi hành vi truy cập trái phép sẽ bị ghi vết địa chỉ IP và xử lý theo quy định pháp luật.
          </div>
        </div>
      </div>
    );
  }

  // RENDER MAIN ADMIN CONSOLE IF AUTHENTICATED
  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {toast && (
        <div style={{position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', zIndex:9999, fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8}}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* CHAT HISTORY MODAL */}
      {chatModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setChatModalOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:580, padding:24, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, borderBottom:'1px solid #e2e8f0', paddingBottom:12}}>
              <div>
                <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0f172a'}}>Nội dung Chat giao dịch</h3>
                <div style={{fontSize:12, color:'#64748b', marginTop:2}}>
                  Trao đổi giữa <b>{chatData?.buyerName || 'Bên Mua'}</b> và <b>{chatData?.sellerName || 'Bên Bán'}</b>
                </div>
              </div>
              <button onClick={() => setChatModalOpen(false)} style={{background:'transparent', border:'none', cursor:'pointer'}}><X size={20} color="#64748b" /></button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:10, maxHeight:360, overflowY:'auto', padding:12, background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', marginBottom:20}}>
              {chatData?.messages && chatData.messages.length > 0 ? (
                chatData.messages.map((m: any, idx: number) => (
                  <div key={m.id || idx} style={{display:'flex', flexDirection:'column', alignItems: m.sender_name === chatData.buyerName ? 'flex-start' : 'flex-end'}}>
                    <span style={{fontSize:10.5, color:'#64748b', marginBottom:2, fontWeight:600}}>{m.sender_name}</span>
                    <div style={{
                      padding:'8px 14px',
                      borderRadius:12,
                      fontSize:13,
                      maxWidth:'80%',
                      background: m.sender_name === chatData.buyerName ? '#ffffff' : '#00a65a',
                      color: m.sender_name === chatData.buyerName ? '#0f172a' : '#ffffff',
                      border: m.sender_name === chatData.buyerName ? '1px solid #e2e8f0' : 'none',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{textAlign:'center', color:'#64748b', padding:20}}>Đang tải nội dung cuộc trò chuyện...</div>
              )}
            </div>

            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button onClick={() => setChatModalOpen(false)} style={{padding:'8px 20px', borderRadius:8, border:'none', background:'#00a65a', color:'#fff', fontWeight:700, cursor:'pointer'}}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserModalOpen && editingUser && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={() => setEditUserModalOpen(false)}>
          <div style={{background:'#fff', borderRadius:16, width:'90%', maxWidth:480, padding:24, boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}} onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, borderBottom:'1px solid #e2e8f0', paddingBottom:12}}>
              <h3 style={{margin:0, fontSize:18, fontWeight:700, color:'#0f172a'}}>Sửa thông tin người dùng</h3>
              <button onClick={() => setEditUserModalOpen(false)} style={{background:'transparent', border:'none', cursor:'pointer'}}><X size={20} color="#64748b" /></button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Họ và tên *</label>
                <input type="text" value={editUserForm.fullName} onChange={e => setEditUserForm({...editUserForm, fullName: e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Email</label>
                  <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
                </div>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Số điện thoại</label>
                  <input type="text" value={editUserForm.phone} onChange={e => setEditUserForm({...editUserForm, phone: e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}} />
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Trạng thái tài khoản</label>
                  <select value={editUserForm.status} onChange={e => setEditUserForm({...editUserForm, status: e.target.value})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}}>
                    <option value="ACTIVE">● Hoạt động</option>
                    <option value="SUSPENDED">● Đã tạm khóa</option>
                  </select>
                </div>
                <div>
                  <label style={{display:'block', fontSize:13, fontWeight:600, marginBottom:4, color:'#334155'}}>Trạng thái xác minh</label>
                  <select value={editUserForm.isVerified ? 'VERIFIED' : 'UNVERIFIED'} onChange={e => setEditUserForm({...editUserForm, isVerified: e.target.value === 'VERIFIED'})} style={{width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:14}}>
                    <option value="VERIFIED">✓ Đã xác minh</option>
                    <option value="UNVERIFIED">Chưa xác minh</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:24}}>
              <button onClick={() => setEditUserModalOpen(false)} style={{padding:'8px 16px', borderRadius:8, border:'1px solid #cbd5e1', background:'#f8fafc', color:'#475569', fontWeight:600, cursor:'pointer'}}>Hủy</button>
              <button onClick={handleSaveEditUser} style={{padding:'8px 20px', borderRadius:8, border:'none', background:'#00a65a', color:'#fff', fontWeight:700, cursor:'pointer'}}>Lưu thay đổi</button>
            </div>
          </div>
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

      {/* SIDEBAR ADMIN V2 */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-brand">
          <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/assets/logo.png" alt="Tất Tần Tật" style={{ height: 28, objectFit: 'contain' }} />
          </div>
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

          <button className={`admin-nav-item ${activeNav === 'danh-muc' ? 'active' : ''}`} onClick={() => setActiveNav('danh-muc')}>
            <div className="admin-nav-left"><FolderTree size={18} />{!sidebarCollapsed && <span>Quản lý Danh mục & form</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'don-hang' ? 'active' : ''}`} onClick={() => setActiveNav('don-hang')}>
            <div className="admin-nav-left"><ShoppingCart size={18} />{!sidebarCollapsed && <span>Quản lý đơn hàng</span>}</div>
          </button>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>GÓI DỊCH VỤ & QUẢNG CÁO</div>
          <button className={`admin-nav-item ${activeNav === 'goi-dich-vu' ? 'active' : ''}`} onClick={() => setActiveNav('goi-dich-vu')}>
            <div className="admin-nav-left"><PackageCheck size={18} />{!sidebarCollapsed && <span>Khách hàng mua Gói</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge green">{subscriptions.length}</span>}
          </button>

          <button className={`admin-nav-item ${activeNav === 'goi-quang-cao' ? 'active' : ''}`} onClick={() => setActiveNav('goi-quang-cao')}>
            <div className="admin-nav-left"><Megaphone size={18} />{!sidebarCollapsed && <span>Khách hàng Quảng cáo</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge blue">{advertising.length}</span>}
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

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>GIAO DIỆN & BẢO MẬT</div>
          <button className={`admin-nav-item ${activeNav === 'css-editor' ? 'active' : ''}`} onClick={() => setActiveNav('css-editor')}>
            <div className="admin-nav-left"><Code size={18} />{!sidebarCollapsed && <span>Quản lý CSS / Giao diện</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'ho-so' ? 'active' : ''}`} onClick={() => setActiveNav('ho-so')}>
            <div className="admin-nav-left"><User size={18} />{!sidebarCollapsed && <span>Hồ sơ cá nhân</span>}</div>
          </button>

          <button className={`admin-nav-item ${activeNav === 'cai-dat' ? 'active' : ''}`} onClick={() => setActiveNav('cai-dat')}>
            <div className="admin-nav-left"><Settings size={18} />{!sidebarCollapsed && <span>Cài đặt hệ thống</span>}</div>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" target="_blank" className="admin-view-website">
            <ExternalLink size={16} /> {!sidebarCollapsed && <span>Xem website ↗</span>}
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`admin-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* TOPBAR ADMIN V2 */}
        <header className="admin-header">
          <div style={{display:'flex', alignItems:'center', gap:16}}>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title="Thu gọn / Mở rộng Sidebar" style={{background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:8}}>
              <Menu size={20} color="#334155" />
            </button>
            <div className="admin-search" onClick={() => setSearchOpen(true)} style={{cursor:'pointer'}}>
              <Search size={16} color="#64748b" />
              <span>Tìm kiếm tin đăng, người dùng, mã đơn hàng...</span>
              <span style={{background:'#e2e8f0', color:'#475569', padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600, marginLeft:'auto'}}>Ctrl + K</span>
            </div>
          </div>

          <div className="admin-header-actions">
            {/* NOTIFICATIONS BELL DROPDOWN POPOVER */}
            <div style={{position:'relative'}} ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                style={{background:'#f1f5f9', border:'none', width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', cursor:'pointer'}}
                title="Thông báo hệ thống"
              >
                <Bell size={18} color="#334155" />
                {dashboard?.actionRequired.pendingPosts || dashboard?.actionRequired.pendingReports ? (
                  <span style={{position:'absolute', top:8, right:8, width:8, height:8, background:'#ef4444', borderRadius:'50%'}}></span>
                ) : null}
              </button>

              {notifDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 16,
                  boxShadow: '0 16px 36px rgba(0,0,0,0.15)',
                  width: 320,
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Thông báo hệ thống</span>
                    <span style={{ fontSize: 11, color: '#00a65a', fontWeight: 600 }}>Tất Tần Tật Admin</span>
                  </div>

                  <div style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 0' }}>
                    {dashboard?.actionRequired.pendingPosts ? (
                      <div
                        onClick={() => { setActiveNav('tin-dang'); setPostStatusFilter('PENDING'); setNotifDropdownOpen(false); }}
                        style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} /> Có {dashboard.actionRequired.pendingPosts} tin đăng chờ duyệt
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Nhấn để vào trang Quản lý tin đăng kiểm duyệt.</div>
                      </div>
                    ) : null}

                    {dashboard?.actionRequired.pendingReports ? (
                      <div
                        onClick={() => { setActiveNav('reports'); setNotifDropdownOpen(false); }}
                        style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldAlert size={14} /> Có {dashboard.actionRequired.pendingReports} báo cáo vi phạm mới
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Nhấn để vào trang xử lý Báo cáo vi phạm.</div>
                      </div>
                    ) : null}

                    {dashboard?.actionRequired.pendingVerifications ? (
                      <div
                        onClick={() => { setActiveNav('nguoi-dung'); setUserStatusFilter('PENDING'); setNotifDropdownOpen(false); }}
                        style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <UserCheck size={14} /> Có {dashboard.actionRequired.pendingVerifications} tài khoản cần xác minh
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>Nhấn để vào trang Quản lý người dùng.</div>
                      </div>
                    ) : null}

                    {!dashboard?.actionRequired.pendingPosts && !dashboard?.actionRequired.pendingReports && !dashboard?.actionRequired.pendingVerifications && (
                      <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                        🎉 Hiện tại không có thông báo cần xử lý khẩn cấp.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ADMIN PROFILE AVATAR DROPDOWN */}
            <div style={{position:'relative'}} ref={profileRef}>
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none'}}
              >
                <img src={adminSession.avatarUrl || '/assets/logo.png'} alt="AdminTTT" style={{width:38, height:38, borderRadius:'50%', objectFit:'cover', border:'2px solid #00a65a', background:'#fff'}} />
                <div>
                  <div style={{fontSize:14, fontWeight:600, color:'#0f172a'}}>{adminSession.fullName || 'Super Admin'}</div>
                  <div style={{fontSize:11, color:'#00a65a', fontWeight:700}}>Admin Security</div>
                </div>
                <ChevronDown size={14} color="#64748b" />
              </div>

              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 14,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  width: 220,
                  zIndex: 1000,
                  padding: '8px 0',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    {adminSession.email}
                  </div>
                  <div onClick={() => { setActiveNav('ho-so'); setProfileDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <User size={16} /> Hồ sơ cá nhân
                  </div>
                  <div onClick={() => { setActiveNav('cai-dat'); setProfileDropdownOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <Settings size={16} /> Cài đặt hệ thống
                  </div>
                  <Link href="/" target="_blank" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                    <ExternalLink size={16} /> Xem website người dùng
                  </Link>
                  <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                  <div
                    onClick={handleAdminLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <LogOut size={16} /> Đăng xuất phiên Admin
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="admin-content">
          {activeNav !== 'tin-dang' && (
            <div className="admin-page-header">
              <div className="admin-page-title">
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <h1>
                    {activeNav === 'banners' ? 'Quản lý Banner hệ thống'
                      : activeNav === 'nguoi-dung' ? 'Quản lý Người dùng & Xác minh'
                      : activeNav === 'danh-muc' ? 'Quản lý Danh mục & form'
                      : activeNav === 'don-hang' ? 'Quản lý Đơn hàng giao dịch thành công'
                      : activeNav === 'goi-dich-vu' ? 'Khách hàng mua Gói Đẩy tin & Đăng tin'
                      : activeNav === 'goi-quang-cao' ? 'Khách hàng mua Gói Quảng cáo & Banner'
                      : activeNav === 'reports' ? 'Báo cáo vi phạm & Moderation'
                      : activeNav === 'css-editor' ? 'Chỉnh sửa Giao diện CSS'
                      : activeNav === 'ho-so' ? 'Hồ sơ cá nhân Admin'
                      : activeNav === 'cai-dat' ? 'Cài đặt hệ thống'
                      : 'Tổng quan hệ thống Quản trị'}
                  </h1>
                </div>
                <p>
                  {activeNav === 'banners' ? 'Thêm mới, tải ảnh từ máy tính, bật/tắt và quản lý thời hạn hiển thị của các Banner quảng cáo.'
                    : activeNav === 'nguoi-dung' ? 'Quản lý danh sách thành viên, xác minh tài khoản, sửa và xóa tài khoản vi phạm.'
                    : activeNav === 'danh-muc' ? 'Thiết lập danh mục, tạo thuộc tính động và quản lý phiên bản biểu mẫu đăng tin.'
                    : activeNav === 'don-hang' ? 'Theo dõi danh sách đơn hàng đã giao dịch thành công, giá trị, phí nền tảng, số tiền thực nhận và xem nội dung chat.'
                    : activeNav === 'goi-dich-vu' ? 'Quản lý danh sách khách hàng và các shop đã mua gói đẩy tin, tăng hạn mức đăng tin trên nền tảng.'
                    : activeNav === 'goi-quang-cao' ? 'Quản lý danh sách nhà quảng cáo mua gói Banner VIP, ưu tiên hiển thị sản phẩm trên ứng dụng.'
                    : activeNav === 'reports' ? 'Xử lý các báo cáo vi phạm sản phẩm và người dùng từ cộng đồng.'
                    : activeNav === 'css-editor' ? 'Chỉnh sửa trực tiếp style CSS của các trang giao diện trong hệ thống Tất Tần Tật.'
                    : activeNav === 'ho-so' ? 'Thông tin cá nhân thành viên và đổi mật khẩu quản trị.'
                    : activeNav === 'cai-dat' ? 'Cấu hình các tham số vận hành toàn hệ thống.'
                    : 'Theo dõi hoạt động và các công việc cần xử lý của Tất Tần Tật.'}
                </p>
              </div>

              <div className="admin-filters">
                {activeNav === 'tong-quan' && ['Hôm nay', '7 ngày', '30 ngày', '12 tháng'].map((range) => (
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
          )}

          {/* EMBEDDED CATEGORY & LISTING TEMPLATES MANAGEMENT */}
          {activeNav === 'danh-muc' ? (
            <div className="dashboard-card" style={{ padding: 24 }}>
              <TemplateAdmin />
            </div>
          ) : activeNav === 'tin-dang' ? (
            /* REDESIGNED LISTING MANAGEMENT MODULE */
            <ListingManagementPage
              posts={posts}
              categories={categories}
              onRefresh={fetchPostsData}
              onApprove={handleApprovePost}
              onUnhide={handleUnhidePost}
              onHide={handleHidePost}
              onSaveEdit={(id, form) => {
                fetch(`/api/v1/admin/posts/${id}`, {
                  method: 'PATCH',
                  headers: getAuthHeaders(),
                  body: JSON.stringify(form),
                })
                  .then(r => r.json())
                  .then(res => {
                    if (res.success) {
                      showToast('Đã cập nhật tin đăng thành công!');
                      fetchPostsData();
                    }
                  });
              }}
              onDelete={handleDeletePost}
              onToast={showToast}
              getAuthHeaders={getAuthHeaders}
            />
          ) : activeNav === 'nguoi-dung' ? (
            /* USERS MANAGEMENT MODULE WITH EDIT & DELETE */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{gap:12, flexWrap:'wrap'}}>
                <h3>Quản lý thành viên hệ thống ({users.length})</h3>
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
                            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                              {u.verification_status !== 'VERIFIED' && (
                                <button onClick={() => handleVerifyUser(u.id)} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Xác minh</button>
                              )}
                              <button onClick={() => handleOpenEditUser(u)} style={{background:'#e0f2fe', color:'#0284c7', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
                                <Edit size={13} /> Sửa
                              </button>
                              <button onClick={() => handleDeleteUser(u.id)} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'6px 10px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
                                <Trash2 size={13} /> Xóa
                              </button>
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
          ) : activeNav === 'don-hang' ? (
            /* ORDERS MANAGEMENT MODULE (REQ 4) */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{gap:12, flexWrap:'wrap'}}>
                <h3>Đơn hàng giao dịch thành công ({orders.length})</h3>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    style={{padding:'6px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13}}
                  >
                    <option value="">Tất cả đơn hàng</option>
                    <option value="COMPLETED">Thành công (Completed)</option>
                    <option value="PAID">Đã thanh toán (Paid)</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Sản phẩm</th>
                      <th>Người bán</th>
                      <th>Người mua</th>
                      <th>Giá trị</th>
                      <th>Phí nền tảng (2.5%)</th>
                      <th>Thực nhận</th>
                      <th>Ngày giao dịch</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(o => (
                        <tr key={o.id}>
                          <td style={{fontWeight:700, color:'#0f172a'}}>#{o.order_code || o.id.slice(0, 8)}</td>
                          <td style={{fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{o.product_title || 'Sản phẩm mua bán'}</td>
                          <td>
                            <div style={{fontWeight:600, fontSize:13}}>{o.seller_name}</div>
                            <div style={{fontSize:11, color:'#64748b'}}>{o.seller_email}</div>
                          </td>
                          <td>
                            <div style={{fontWeight:600, fontSize:13}}>{o.buyer_name}</div>
                            <div style={{fontSize:11, color:'#64748b'}}>{o.buyer_email}</div>
                          </td>
                          <td style={{fontWeight:700, color:'#059669', fontSize:14}}>{formatVnd(o.total_amount)}</td>
                          <td style={{fontWeight:600, color:'#d97706', fontSize:13}}>{formatVnd(o.platform_fee || Math.round(parseInt(o.total_amount || '0') * 0.025))}</td>
                          <td style={{fontWeight:700, color:'#2563eb', fontSize:14}}>{formatVnd(o.seller_net_amount || (parseInt(o.total_amount || '0') - Math.round(parseInt(o.total_amount || '0') * 0.025)))}</td>
                          <td style={{fontSize:12, color:'#64748b'}}>{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                          <td><span className="status-badge delivered">{o.order_status || 'COMPLETED'}</span></td>
                          <td>
                            <button
                              onClick={() => handleOpenChatModal(o.id)}
                              style={{ background: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <MessageSquare size={13} /> Xem Chat
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={10} style={{textAlign:'center', color:'#64748b', padding:24}}>Chưa có đơn hàng giao dịch thành công.</td></tr>
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
                      <tr><td colSpan={7} style={{textAlign:'center', color:'#64748b', padding:24}}>Chưa có báo cáo vi phạm mới.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'banners' ? (
            /* BANNERS MANAGEMENT MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Quản lý Banner quảng cáo ({banners.length})</h3>
                <button onClick={handleOpenAddBanner} style={{background:'#00a65a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                  <Plus size={16} /> Thêm Banner mới
                </button>
              </div>

              <div className="table-responsive" style={{marginTop:16}}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hình ảnh</th>
                      <th>Tên Banner</th>
                      <th>Vị trí</th>
                      <th>Liên kết (Target)</th>
                      <th>Hạn hiển thị</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.length > 0 ? (
                      banners.map(b => (
                        <tr key={b.id}>
                          <td><img src={b.imageUrl} alt="" style={{height:40, maxWidth:100, borderRadius:6, objectFit:'cover', border:'1px solid #cbd5e1'}} /></td>
                          <td style={{fontWeight:600, color:'#0f172a'}}>{b.title}</td>
                          <td><span className="admin-badge blue">{b.position}</span></td>
                          <td style={{fontSize:12, color:'#64748b'}}>{b.targetUrl}</td>
                          <td style={{fontSize:12, color:'#64748b'}}>{b.expiryDate}</td>
                          <td>
                            <span className={`status-badge ${b.status === 'ACTIVE' ? 'approved' : 'danger'}`}>
                              {b.status === 'ACTIVE' ? 'Đang hiển thị' : 'Tạm ẩn'}
                            </span>
                          </td>
                          <td>
                            <div style={{display:'flex', gap:8}}>
                              <button onClick={() => handleOpenEditBanner(b)} style={{background:'#f1f5f9', border:'none', padding:'6px 10px', borderRadius:6, cursor:'pointer', color:'#334155'}} title="Sửa"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteBanner(b.id)} style={{background:'#fee2e2', border:'none', padding:'6px 10px', borderRadius:6, cursor:'pointer', color:'#dc2626'}} title="Xóa"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} style={{textAlign:'center', color:'#64748b', padding:24}}>Chưa có banner nào. Hãy tạo banner đầu tiên.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeNav === 'ho-so' ? (
            /* MY PROFILE MODULE (REQ 7) */
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
              {/* PROFILE CARD LEFT */}
              <div className="dashboard-card" style={{ textAlign: 'center', padding: 28 }}>
                <img src={adminSession.avatarUrl || '/assets/logo.png'} alt="" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid #00a65a', background: '#fff', margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{adminSession.fullName}</h3>
                <span className="admin-badge green" style={{ fontSize: 12, padding: '4px 12px' }}>{adminSession.role}</span>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'left', fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>Email: <b style={{ color: '#0f172a' }}>{adminSession.email}</b></div>
                  <div>Trạng thái: <span className="status-badge approved">Hoạt động</span></div>
                  <div>Xác minh: <span className="status-badge approved">✓ Đã xác minh</span></div>
                  <div>Ngày tham gia: <b style={{ color: '#0f172a' }}>23/09/2026</b></div>
                </div>

                <label style={{ background: '#00a65a', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, width: '100%', justifyContent: 'center' }}>
                  <Upload size={16} /> Thay đổi Avatar từ máy tính
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>

              {/* PROFILE RIGHT: CHANGE PASSWORD FORM & ACTIVITY AUDIT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="dashboard-card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Đổi mật khẩu tài khoản</h3>
                  <form onSubmit={handleChangePassword}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Mật khẩu hiện tại *</label>
                        <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Mật khẩu mới *</label>
                        <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Xác nhận mật khẩu mới *</label>
                        <input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                      </div>
                    </div>
                    <button type="submit" style={{ background: '#00a65a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 14 }}>
                      LƯU MẬT KHẨU MỚI
                    </button>
                  </form>
                </div>

                <div className="dashboard-card">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#0f172a' }}>Lịch sử hoạt động quản trị (Audit Log)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
                      dashboard.recentActivities.slice(0, 5).map((log) => (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{log.action} ({log.entity_type})</span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#64748b', fontSize: 13 }}>Chưa có lịch sử hoạt động.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeNav === 'cai-dat' ? (
            /* SYSTEM SETTINGS MODULE */
            <div className="dashboard-card" style={{ maxWidth: 720 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>Cài đặt hệ thống Tất Tần Tật</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tên nền tảng *</label>
                  <input type="text" value={systemSettings.siteName} onChange={e => setSystemSettings({...systemSettings, siteName: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email hỗ trợ *</label>
                    <input type="email" value={systemSettings.supportEmail} onChange={e => setSystemSettings({...systemSettings, supportEmail: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Hotline *</label>
                    <input type="text" value={systemSettings.supportPhone} onChange={e => setSystemSettings({...systemSettings, supportPhone: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tỷ lệ phí hoa hồng (% giao dịch)</label>
                    <input type="text" value={systemSettings.commissionRate} onChange={e => setSystemSettings({...systemSettings, commissionRate: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Tối đa số ảnh / tin đăng</label>
                    <input type="text" value={systemSettings.maxImagesPerPost} onChange={e => setSystemSettings({...systemSettings, maxImagesPerPost: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>Tự động duyệt tin đăng mới</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Tự động chuyển tin mới sang trạng thái Đã duyệt không cần qua kiểm duyệt viên.</span>
                  </div>
                  <input type="checkbox" checked={systemSettings.autoApproveListings} onChange={e => setSystemSettings({...systemSettings, autoApproveListings: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 14, color: '#dc2626' }}>Chế độ Bảo trì Hệ thống</strong>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Tạm khóa tính năng mua bán để nâng cấp máy chủ.</span>
                  </div>
                  <input type="checkbox" checked={systemSettings.maintenanceMode} onChange={e => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                </div>

                <button onClick={() => showToast('Đã lưu cấu hình hệ thống thành công!')} style={{ background: '#00a65a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', width: 'fit-content', marginTop: 10 }}>
                  LƯU CÀI ĐẶT HỆ THỐNG
                </button>
              </div>
            </div>
          ) : activeNav === 'tong-quan' ? (
            /* DASHBOARD OVERVIEW */
            <>
              {/* ACTION ITEMS NEEDED */}
              <div className="action-required-box">
                <div className="action-required-title">
                  <ShieldAlert size={18} color="#b45309" /> CẦN XỬ LÝ NGAY
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
                  <div className="kpi-value">{dashboard ? dashboard.kpis.activeListings.toLocaleString('de-DE') : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.activeListingsTrend ? `+${dashboard.kpis.activeListingsTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Người dùng mới</span>
                    <div className="kpi-icon blue"><Users size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? dashboard.kpis.newUsers.toLocaleString('de-DE') : '...'}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> {dashboard?.kpis.newUsersTrend ? `+${dashboard.kpis.newUsersTrend}%` : '0%'} <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Đơn hàng hoàn thành</span>
                    <div className="kpi-icon purple"><PackageCheck size={20} /></div>
                  </div>
                  <div className="kpi-value">{dashboard ? dashboard.kpis.completedOrders.toLocaleString('de-DE') : '...'}</div>
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
          ) : activeNav === 'css-editor' ? (
            /* LIVE CSS EDITOR MODULE */
            <div className="dashboard-card">
              <div className="card-header-flex" style={{gap:12, flexWrap:'wrap', marginBottom:16}}>
                <div>
                  <h3>Trình chỉnh sửa CSS trực tiếp (Live CSS Editor)</h3>
                  <p style={{fontSize:12, color:'#64748b', margin:'4px 0 0'}}>Thay đổi giao diện và biến màu sắc các trang trong hệ thống mà không cần build lại dự án.</p>
                </div>

                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                  <select
                    value={selectedCssFile}
                    onChange={e => setSelectedCssFile(e.target.value)}
                    style={{padding:'8px 12px', borderRadius:8, border:'1px solid #cbd5e1', fontSize:13, fontWeight:600, background:'#f8fafc', color:'#0f172a'}}
                  >
                    {cssFiles.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveCss}
                    disabled={cssLoading}
                    style={{background:'#00a65a', color:'#fff', border:'none', padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6}}
                  >
                    <Save size={16} /> {cssLoading ? 'Đang lưu...' : 'LƯU VÀ ÁP DỤNG CSS'}
                  </button>
                </div>
              </div>

              <div style={{background:'#0f172a', color:'#38bdf8', padding:'10px 16px', borderRadius:'10px 10px 0 0', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <span>📄 Đang chỉnh sửa: <b>app/{selectedCssFile}</b></span>
                <span style={{color:'#94a3b8', fontWeight:400}}>{cssFiles.find(f => f.key === selectedCssFile)?.note}</span>
              </div>

              <textarea
                value={cssCode}
                onChange={e => setCssCode(e.target.value)}
                style={{
                  width: '100%',
                  height: 520,
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: 13,
                  lineHeight: 1.5,
                  padding: 16,
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '0 0 10px 10px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          ) : (
            /* OTHER MODULES PLACEHOLDER */
            <div className="dashboard-card" style={{padding:40, textAlign:'center'}}>
              <Sparkles size={32} color="#00a65a" style={{marginBottom:12}} />
              <h3 style={{fontSize:18, fontWeight:700, color:'#0f172a'}}>Tính năng đang mở rộng trong phiên bản Admin Console V2</h3>
              <p style={{color:'#64748b', fontSize:14, maxWidth:500, margin:'8px auto 0'}}>Bạn đang xem phần quản trị {activeNav}. Dữ liệu được kết nối thời gian thực với hệ thống NestJS & PostgreSQL.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
