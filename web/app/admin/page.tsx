'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Users, FolderTree, ShoppingCart,
  CreditCard, Megaphone, BarChart3, Settings, Bell, Search,
  ChevronDown, TrendingUp, DollarSign, PackageCheck, ShieldAlert,
  Calendar, ArrowRight, ExternalLink, ShieldCheck, UserCheck, BarChart,
  Menu, X, CheckCircle, XCircle, Eye, Lock, Unlock, Activity, Clock, Image as ImageIcon
} from 'lucide-react';
import '../admin.css';

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState('tong-quan');
  const [dateRange, setDateRange] = useState('30 ngày');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={`admin-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {toast && (
        <div style={{position:'fixed', bottom:24, right:24, background:'#059669', color:'#fff', padding:'12px 20px', borderRadius:10, boxShadow:'0 10px 25px rgba(0,0,0,0.15)', zIndex:9999, fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8}}>
          <CheckCircle size={18} /> {toast}
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
            {!sidebarCollapsed && <span className="admin-badge green">2</span>}
          </Link>

          <div style={{fontSize:11, fontWeight:700, color:'#64748b', padding:'16px 16px 8px', letterSpacing:'0.5px'}}>TÀI CHÍNH & HỆ THỐNG</div>
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
              <h1>{activeNav === 'banners' ? 'Quản lý Banner hệ thống' : 'Tổng quan hệ thống'}</h1>
              <p>{activeNav === 'banners' ? 'Thêm mới, bật/tắt và cập nhật liên kết banner trang chủ và sidebar.' : 'Theo dõi hoạt động và các công việc cần xử lý của Tất Tần Tật.'}</p>
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

          {activeNav === 'banners' ? (
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Danh sách Banner quảng cáo & Hero</h3>
                <button onClick={() => showToast('Đã mở modal thêm banner mới')} style={{background:'#00a65a', color:'#fff', border:'none', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer'}}>+ Thêm Banner mới</button>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Hình ảnh</th>
                      <th>Vị trí hiển thị</th>
                      <th>Đường dẫn liên kết (Link)</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#B01</td>
                      <td><img src="/assets/hero-dog-banner.png" alt="Hero" style={{width:90, height:36, borderRadius:4, objectFit:'cover'}} /></td>
                      <td style={{fontWeight:600}}>Hero Banner (Trang chủ)</td>
                      <td>/sell</td>
                      <td><span className="status-badge approved">Đang hiển thị</span></td>
                      <td>
                        <button onClick={() => showToast('Đã cập nhật banner Hero!')} style={{background:'#f1f5f9', color:'#334155', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Chỉnh sửa</button>
                      </td>
                    </tr>
                    <tr>
                      <td>#B02</td>
                      <td><img src="/assets/banner_right.png" alt="Sidebar" style={{width:45, height:70, borderRadius:4, objectFit:'cover'}} /></td>
                      <td style={{fontWeight:600}}>Sidebar Banner (Cột phải trang chủ)</td>
                      <td>/sell</td>
                      <td><span className="status-badge approved">Đang hiển thị</span></td>
                      <td>
                        <button onClick={() => showToast('Đã cập nhật banner Sidebar!')} style={{background:'#f1f5f9', color:'#334155', border:'none', padding:'4px 8px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer'}}>Chỉnh sửa</button>
                      </td>
                    </tr>
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
