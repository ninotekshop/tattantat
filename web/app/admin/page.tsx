'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, FolderTree, ShoppingCart,
  CreditCard, Megaphone, BarChart3, Settings, Bell, Search,
  ChevronDown, TrendingUp, DollarSign, PackageCheck, ShieldAlert,
  Calendar, ArrowRight, ExternalLink, ShieldCheck, UserCheck, BarChart,
  Menu, X, CheckCircle, XCircle, Eye, Lock, Unlock, Activity, Clock, Image as ImageIcon,
  Edit, Trash2, Plus, Code, Save, RotateCcw, Upload
} from 'lucide-react';
import '../admin.css';

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  position: string;
  targetUrl: string;
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: '#B01',
    title: 'Hero Banner Trang chủ',
    imageUrl: '/assets/hero-dog-banner.png',
    position: 'Hero Banner (Trang chủ)',
    targetUrl: '/sell',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: '#B02',
    title: 'Banner Quảng cáo Bên Trái (Floating Left)',
    imageUrl: '/assets/banner_right.png',
    position: 'Floating Left Banner (Mép ngoài trái)',
    targetUrl: '/sell',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: '#B03',
    title: 'Banner Quảng cáo Bên Phải (Floating Right)',
    imageUrl: '/assets/banner_right.png',
    position: 'Floating Right Banner (Mép ngoài phải)',
    targetUrl: '/sell',
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: '#B04',
    title: 'Banner Khuyến mãi Khai trương',
    imageUrl: '/assets/banner_1392x250.png',
    position: 'Category Banner',
    targetUrl: '/categories',
    expiryDate: '2026-08-15',
    status: 'EXPIRED',
  },
];

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState('tong-quan');
  const [dateRange, setDateRange] = useState('30 ngày');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // BANNER MANAGEMENT STATE WITH LOCAL STORAGE PERSISTENCE AND DEDUPLICATION
  const [banners, setBanners] = useState<BannerItem[]>(DEFAULT_BANNERS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tattantat_banners');
      if (saved) {
        const parsed: BannerItem[] = JSON.parse(saved);
        const seen = new Set<string>();
        const deduped = parsed.map((item, idx) => {
          if (seen.has(item.id)) {
            const newId = `#B${10 + idx}`;
            return { ...item, id: newId };
          }
          seen.add(item.id);
          return item;
        });
        setBanners(deduped);
        localStorage.setItem('tattantat_banners', JSON.stringify(deduped));
      } else {
        localStorage.setItem('tattantat_banners', JSON.stringify(DEFAULT_BANNERS));
      }
    } catch (e) {}
  }, []);

  const saveBannersToStorage = (updatedBanners: BannerItem[]) => {
    setBanners(updatedBanners);
    try {
      localStorage.setItem('tattantat_banners', JSON.stringify(updatedBanners));
      window.dispatchEvent(new Event('tattantat-banner-change'));
    } catch (e) {}
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setBannerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
    let updated: BannerItem[];
    if (editingBanner) {
      updated = banners.map(b => b.id === editingBanner.id ? { ...b, ...formBanner } : b);
      showToast('Đã cập nhật Banner và đồng bộ trang web!');
    } else {
      const newId = `#B${Math.floor(10 + Math.random() * 90)}`;
      updated = [...banners, { id: newId, ...formBanner }];
      showToast('Đã thêm Banner mới và đồng bộ trang web!');
    }
    saveBannersToStorage(updated);
    setBannerModalOpen(false);
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Banner ${id} khỏi hệ thống?`)) {
      const updated = banners.filter(b => b.id !== id);
      saveBannersToStorage(updated);
      showToast(`Đã xóa Banner ${id} khỏi hệ thống và gỡ khỏi trang web!`);
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

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {toast && (
        <div style={{position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', zIndex:9999, fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8}}>
          <CheckCircle size={18} /> {toast}
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

      {/* COMMAND PALETTE MODAL */}
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
            <div style={{padding:20, minHeight:200, color:'#64748b', fontSize:14, textAlign:'center'}}>
              {searchQuery ? (
                <div>Đang tìm kiếm kết quả cho "{searchQuery}"...</div>
              ) : (
                <div>Gợi ý: Nhập <b>DH...</b> để tìm đơn hàng, <b>TTT...</b> để tìm tin đăng, hoặc tên người dùng.</div>
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
          <Link href="/admin" className={`admin-nav-item ${activeNav === 'tong-quan' ? 'active' : ''}`} onClick={() => setActiveNav('tong-quan')}>
            <div className="admin-nav-left"><LayoutDashboard size={18} />{!sidebarCollapsed && <span>Tổng quan</span>}</div>
          </Link>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>QUẢN LÝ</div>
          <Link href="/admin" className={`admin-nav-item ${activeNav === 'tin-dang' ? 'active' : ''}`} onClick={() => setActiveNav('tin-dang')}>
            <div className="admin-nav-left"><FileText size={18} />{!sidebarCollapsed && <span>Quản lý tin đăng</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge amber">18 chờ duyệt</span>}
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'nguoi-dung' ? 'active' : ''}`} onClick={() => setActiveNav('nguoi-dung')}>
            <div className="admin-nav-left"><Users size={18} />{!sidebarCollapsed && <span>Quản lý người dùng</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge green">452</span>}
          </Link>

          <Link href="/admin/listing-templates" className={`admin-nav-item ${activeNav === 'danh-muc' ? 'active' : ''}`} onClick={() => setActiveNav('danh-muc')}>
            <div className="admin-nav-left"><FolderTree size={18} />{!sidebarCollapsed && <span>Quản lý danh mục</span>}</div>
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'don-hang' ? 'active' : ''}`} onClick={() => setActiveNav('don-hang')}>
            <div className="admin-nav-left"><ShoppingCart size={18} />{!sidebarCollapsed && <span>Quản lý đơn hàng</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge green">34</span>}
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'banners' ? 'active' : ''}`} onClick={() => setActiveNav('banners')}>
            <div className="admin-nav-left"><ImageIcon size={18} />{!sidebarCollapsed && <span>Quản lý Banner</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge green">{banners.length}</span>}
          </Link>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>GIAO DIỆN & TÀI CHÍNH</div>
          <Link href="/admin" className={`admin-nav-item ${activeNav === 'css-editor' ? 'active' : ''}`} onClick={() => setActiveNav('css-editor')}>
            <div className="admin-nav-left"><Code size={18} />{!sidebarCollapsed && <span>Quản lý CSS / Giao diện</span>}</div>
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'thanh-toan' ? 'active' : ''}`} onClick={() => setActiveNav('thanh-toan')}>
            <div className="admin-nav-left"><CreditCard size={18} />{!sidebarCollapsed && <span>Thanh toán & Giao dịch</span>}</div>
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'quang-cao' ? 'active' : ''}`} onClick={() => setActiveNav('quang-cao')}>
            <div className="admin-nav-left"><Megaphone size={18} />{!sidebarCollapsed && <span>Quảng cáo</span>}</div>
            {!sidebarCollapsed && <span className="admin-badge amber">8</span>}
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'bao-cao' ? 'active' : ''}`} onClick={() => setActiveNav('bao-cao')}>
            <div className="admin-nav-left"><BarChart3 size={18} />{!sidebarCollapsed && <span>Báo cáo & Thống kê</span>}</div>
          </Link>

          <Link href="/admin" className={`admin-nav-item ${activeNav === 'cai-dat' ? 'active' : ''}`} onClick={() => setActiveNav('cai-dat')}>
            <div className="admin-nav-left"><Settings size={18} />{!sidebarCollapsed && <span>Cài đặt hệ thống</span>}</div>
          </Link>
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
              <span style={{position:'absolute', top:8, right:8, width:8, height:8, background:'#ef4444', borderRadius:'50%'}}></span>
            </button>

            <div style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer'}}>
              <img src="/assets/product-1.jpg" alt="Admin" style={{width:38, height:38, borderRadius:'50%', objectFit:'cover'}} />
              <div>
                <div style={{fontSize:14, fontWeight:600, color:'#0f172a'}}>Admin</div>
                <div style={{fontSize:11, color:'#64748b'}}>Super Admin</div>
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
                {activeNav === 'banners' ? 'Quản lý Banner hệ thống' : activeNav === 'css-editor' ? 'Chỉnh sửa Giao diện CSS' : 'Tổng quan hệ thống'}
              </h1>
              <p>
                {activeNav === 'banners' ? 'Thêm mới, tải ảnh từ máy tính, bật/tắt và quản lý thời hạn hiển thị của các Banner quảng cáo.'
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
              <button className="admin-filter-btn">
                <Calendar size={15} color="#64748b" /> Tùy chọn ▾
              </button>
            </div>
          </div>

          {/* QUẢN LÝ CSS / CHỈNH SỬA GIAO DIỆN MODULE */}
          {activeNav === 'css-editor' ? (
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
          ) : activeNav === 'banners' ? (
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
                      <tr key={b.id + '-' + idx}>
                        <td style={{fontWeight:600}}>{b.id}</td>
                        <td><img src={b.imageUrl} alt="" style={{width:65, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                        <td style={{fontWeight:600}}>{b.title}</td>
                        <td>{b.position}</td>
                        <td><code style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:4, fontSize:12}}>{b.targetUrl}</code></td>
                        <td>
                          <span style={{fontSize:12, fontWeight:500, color:'#475569'}}>
                            {b.expiryDate}
                          </span>
                        </td>
                        <td>
                          {b.status === 'ACTIVE' ? (
                            <span className="status-badge approved">Đang hiển thị</span>
                          ) : b.status === 'EXPIRED' ? (
                            <span className="status-badge pending" style={{background:'#fee2e2', color:'#dc2626'}}>Đã hết hạn</span>
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
          ) : activeNav === 'tong-quan' ? (
            <>
              {/* CẦN XỬ LÝ (ACTION ITEMS) */}
              <div className="action-required-box">
                <div className="action-required-title">
                  <ShieldAlert size={18} color="#d97706" /> CẦN XỬ LÝ NGAY
                </div>
                <div className="action-chips-grid">
                  <div className="action-chip warning" onClick={() => showToast('Đang mở danh sách 18 tin chờ duyệt')}>
                    <strong>18</strong> Tin chờ duyệt
                  </div>
                  <div className="action-chip danger" onClick={() => showToast('Đang mở danh sách 5 báo cáo vi phạm')}>
                    <strong>5</strong> Báo cáo vi phạm
                  </div>
                  <div className="action-chip info" onClick={() => showToast('Đang mở danh sách 3 giao dịch lỗi')}>
                    <strong>3</strong> Giao dịch lỗi
                  </div>
                  <div className="action-chip success" onClick={() => showToast('Đang mở danh sách 7 tài khoản cần xác minh')}>
                    <strong>7</strong> Tài khoản cần xác minh
                  </div>
                </div>
              </div>

              {/* KPI CARDS */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Tổng tin đăng hoạt động</span>
                    <div className="kpi-icon green"><FileText size={20} /></div>
                  </div>
                  <div className="kpi-value">12.458</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> +12% <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Người dùng mới</span>
                    <div className="kpi-icon blue"><Users size={20} /></div>
                  </div>
                  <div className="kpi-value">3.892</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> +18% <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Đơn hàng hoàn thành</span>
                    <div className="kpi-icon purple"><PackageCheck size={20} /></div>
                  </div>
                  <div className="kpi-value">1.245</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> +24% <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">Doanh thu ước tính</span>
                    <div className="kpi-icon orange"><DollarSign size={20} /></div>
                  </div>
                  <div className="kpi-value">468.750.000đ</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={15} /> +32% <span style={{color:'#64748b', fontWeight:400}}>so với kỳ trước</span>
                  </div>
                </div>
              </div>

              {/* CHARTS & ACTIVITY */}
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
                    [Biểu đồ thống kê tăng trưởng theo thời gian]
                  </div>
                </div>

                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Tỷ lệ tin đăng theo danh mục</h3>
                  </div>
                  <div style={{height:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:12, border:'1px dashed #cbd5e1', color:'#64748b', fontSize:13, gap:10}}>
                    <div style={{width:110, height:110, borderRadius:'50%', background:'conic-gradient(#3b82f6 0deg 180deg, #10b981 180deg 260deg, #f59e0b 260deg 320deg, #ec4899 320deg 360deg)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <div style={{width:65, height:65, background:'#fff', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0f172a'}}>
                        <span>12.458</span>
                        <span style={{fontSize:9, color:'#64748b'}}>tin đăng</span>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:12, fontSize:11, color:'#64748b'}}>
                      <span>🔵 Đồ công nghệ (32%)</span>
                      <span>🟢 Xe cộ (21%)</span>
                      <span>🟠 Nhà đất (18%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLES GRID */}
              <div className="dashboard-grid-2">
                {/* TIN ĐĂNG MỚI NHẤT */}
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Tin đăng mới nhất</h3>
                    <Link href="/admin">Xem tất cả →</Link>
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
                        <tr>
                          <td><img src="/assets/product-1.jpg" alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                          <td style={{fontWeight:600}}>iPhone 15 Pro 128GB</td>
                          <td>21.500.000đ</td>
                          <td>Điện thoại</td>
                          <td><span className="status-badge pending">Chờ duyệt</span></td>
                          <td>
                            <div style={{display:'flex', gap:6}}>
                              <button onClick={() => showToast('Đã duyệt tin đăng thành công!')} style={{background:'#d1fae5', color:'#059669', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Duyệt</button>
                              <button onClick={() => showToast('Đã từ chối tin đăng.')} style={{background:'#fee2e2', color:'#dc2626', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Từ chối</button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td><img src="/assets/product-1.jpg" alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                          <td style={{fontWeight:600}}>MacBook Air M1 2020</td>
                          <td>16.200.000đ</td>
                          <td>Laptop</td>
                          <td><span className="status-badge approved">Đã duyệt</span></td>
                          <td>
                            <button onClick={() => showToast('Đã ẩn tin đăng.')} style={{background:'#f1f5f9', color:'#475569', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Ẩn</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ĐƠN HÀNG GẦN ĐÂY */}
                <div className="dashboard-card">
                  <div className="card-header-flex">
                    <h3>Đơn hàng gần đây</h3>
                    <Link href="/admin">Xem tất cả →</Link>
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
                        <tr>
                          <td style={{fontWeight:600}}>#DH12546</td>
                          <td>Nguyễn Văn A</td>
                          <td>3.500.000đ</td>
                          <td>Đã thanh toán</td>
                          <td><span className="status-badge delivered">Đã giao</span></td>
                        </tr>
                        <tr>
                          <td style={{fontWeight:600}}>#DH12545</td>
                          <td>Lê Thị B</td>
                          <td>11.000.000đ</td>
                          <td>COD</td>
                          <td><span className="status-badge processing">Đang xử lý</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ACTIVITY LOG */}
              <div className="dashboard-card" style={{marginTop:24}}>
                <div className="card-header-flex">
                  <h3><Activity size={18} color="#00a65a" style={{marginRight:8, verticalAlign:'middle'}} /> Hoạt động gần đây (Audit Log)</h3>
                  <Link href="/admin">Xem nhật ký →</Link>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {[
                    { time: '15:42', action: 'Admin duyệt tin #TTT10245 (iPhone 15 Pro)', user: 'Admin Super' },
                    { time: '15:38', action: 'Người dùng mới đăng ký (nguyenvana***@gmail.com)', user: 'System' },
                    { time: '15:31', action: 'Tin #TTT10241 nhận báo cáo vi phạm giá', user: 'Moderator' },
                    { time: '15:22', action: 'Đơn hàng #DH12546 hoàn thành giao dịch', user: 'System' },
                  ].map((log, idx) => (
                    <div key={idx} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', borderRadius:10, fontSize:13}}>
                      <div style={{display:'flex', alignItems:'center', gap:12}}>
                        <span style={{color:'#64748b', fontSize:12, fontWeight:600, background:'#e2e8f0', padding:'2px 6px', borderRadius:4}}><Clock size={11} style={{marginRight:3, verticalAlign:'middle'}} />{log.time}</span>
                        <span style={{color:'#1e293b', fontWeight:500}}>{log.action}</span>
                      </div>
                      <span style={{color:'#64748b', fontSize:12}}>Bởi: <b>{log.user}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="dashboard-card" style={{padding:40, textAlign:'center'}}>
              <h3>Đang phát triển module này</h3>
              <p style={{color:'#64748b', marginTop:8}}>Chức năng quản lý cho mục này đang được hoàn thiện.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
