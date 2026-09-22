'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard, FileText, Users, FolderTree, ShoppingCart,
  CreditCard, Megaphone, BarChart3, Settings, Bell, Search,
  ChevronDown, TrendingUp, DollarSign, PackageCheck, ShieldAlert,
  Calendar, ArrowRight, ExternalLink, ShieldCheck, UserCheck, BarChart
} from 'lucide-react';
import '../admin.css';

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState('tong-quan');

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/assets/logo.png" alt="Tất Tần Tật" />
        </div>

        <nav className="admin-nav">
          <Link href="/admin" className={`admin-nav-item ${activeNav === 'tong-quan' ? 'active' : ''}`} onClick={() => setActiveNav('tong-quan')}>
            <div className="admin-nav-left"><LayoutDashboard size={18} /><span>Tổng quan</span></div>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('tin-dang')}>
            <div className="admin-nav-left"><FileText size={18} /><span>Quản lý tin đăng</span></div>
            <div style={{display:'flex', gap:4}}>
              <span className="admin-badge green">124</span>
              <span className="admin-badge amber">18</span>
            </div>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('nguoi-dung')}>
            <div className="admin-nav-left"><Users size={18} /><span>Quản lý người dùng</span></div>
            <span className="admin-badge green">452</span>
          </Link>

          <Link href="/admin/listing-templates" className="admin-nav-item" onClick={() => setActiveNav('danh-muc')}>
            <div className="admin-nav-left"><FolderTree size={18} /><span>Quản lý danh mục</span></div>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('don-hang')}>
            <div className="admin-nav-left"><ShoppingCart size={18} /><span>Quản lý đơn hàng</span></div>
            <span className="admin-badge green">34</span>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('thanh-toan')}>
            <div className="admin-nav-left"><CreditCard size={18} /><span>Thanh toán & Giao dịch</span></div>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('quang-cao')}>
            <div className="admin-nav-left"><Megaphone size={18} /><span>Quảng cáo</span></div>
            <span className="admin-badge amber">8</span>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('bao-cao')}>
            <div className="admin-nav-left"><BarChart3 size={18} /><span>Báo cáo & Thống kê</span></div>
          </Link>

          <Link href="/admin" className="admin-nav-item" onClick={() => setActiveNav('cai-dat')}>
            <div className="admin-nav-left"><Settings size={18} /><span>Cài đặt hệ thống</span></div>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-promo-box">
            <p style={{fontWeight:600, marginBottom:4}}>Tất Tần Tật Admin v1.0</p>
            <p style={{fontSize:11, opacity:0.8}}>Hệ thống quản trị tập trung</p>
          </div>
          <div style={{marginTop: 16, fontSize: 11, color: '#94a3b8', textAlign:'center'}}>
            © 2026 Tất Tần Tật. All rights reserved.
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main">
        {/* HEADER */}
        <header className="admin-header">
          <div className="admin-search">
            <Search size={16} color="#64748b" />
            <input type="text" placeholder="Tìm kiếm tin đăng, người dùng, mã đơn hàng..." />
            <span style={{background:'#e2e8f0', color:'#475569', padding:'2px 6px', borderRadius:4, fontSize:10, fontWeight:600}}>⌘ K</span>
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
              <h1>Tổng quan</h1>
              <p>Chào mừng bạn trở lại! Đây là tổng quan hoạt động của hệ thống.</p>
            </div>

            <div className="admin-filters">
              <button className="admin-filter-btn">
                <Calendar size={15} color="#64748b" /> 01/09/2025 - 30/09/2025
              </button>
              <button className="admin-filter-btn">
                Tháng này <ChevronDown size={14} color="#64748b" />
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Tổng tin đăng</span>
                <div className="kpi-icon green"><FileText size={20} /></div>
              </div>
              <div className="kpi-value">12.458</div>
              <div className="kpi-trend up">
                <TrendingUp size={15} /> +12% <span style={{color:'#64748b', fontWeight:400}}>so với tháng trước</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Người dùng mới</span>
                <div className="kpi-icon blue"><Users size={20} /></div>
              </div>
              <div className="kpi-value">3.892</div>
              <div className="kpi-trend up">
                <TrendingUp size={15} /> +18% <span style={{color:'#64748b', fontWeight:400}}>so với tháng trước</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Đơn hàng thành công</span>
                <div className="kpi-icon purple"><PackageCheck size={20} /></div>
              </div>
              <div className="kpi-value">1.245</div>
              <div className="kpi-trend up">
                <TrendingUp size={15} /> +24% <span style={{color:'#64748b', fontWeight:400}}>so với tháng trước</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Doanh thu (ước tính)</span>
                <div className="kpi-icon orange"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-value">468.750.000đ</div>
              <div className="kpi-trend up">
                <TrendingUp size={15} /> +32% <span style={{color:'#64748b', fontWeight:400}}>so với tháng trước</span>
              </div>
            </div>
          </div>

          {/* CHARTS & ACTIVITY */}
          <div className="dashboard-grid-2">
            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Biểu đồ hoạt động 7 ngày qua</h3>
                <div style={{display:'flex', gap:16, fontSize:12, fontWeight:500, color:'#64748b'}}>
                  <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#10b981', borderRadius:'50%'}}></span> Tin đăng</span>
                  <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#3b82f6', borderRadius:'50%'}}></span> Người dùng</span>
                  <span style={{display:'flex', alignItems:'center', gap:4}}><span style={{width:8, height:8, background:'#f97316', borderRadius:'50%'}}></span> Đơn hàng</span>
                </div>
              </div>
              <div style={{height:240, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:12, border:'1px dashed #cbd5e1', color:'#64748b', fontSize:13}}>
                [Biểu đồ thống kê tăng trưởng 7 ngày (Interactive Chart)]
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header-flex">
                <h3>Tỷ lệ tin đăng theo danh mục</h3>
              </div>
              <div style={{height:240, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f8fafc', borderRadius:12, border:'1px dashed #cbd5e1', color:'#64748b', fontSize:13, gap:10}}>
                <div style={{width:120, height:120, borderRadius:'50%', background:'conic-gradient(#3b82f6 0deg 180deg, #10b981 180deg 260deg, #f59e0b 260deg 320deg, #ec4899 320deg 360deg)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <div style={{width:70, height:70, background:'#fff', borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0f172a'}}>
                    <span>12.458</span>
                    <span style={{fontSize:9, color:'#64748b'}}>tin đăng</span>
                  </div>
                </div>
                <span>Phân bố danh mục marketplace</span>
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
                      <th>#</th>
                      <th>Hình ảnh</th>
                      <th>Tiêu đề</th>
                      <th>Danh mục</th>
                      <th>Người đăng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td><img src="/assets/product-1.jpg" alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                      <td style={{fontWeight:600}}>iPhone 15 Pro 128GB</td>
                      <td>Điện thoại</td>
                      <td>Nguyễn Văn A</td>
                      <td><span className="status-badge pending">Chờ duyệt</span></td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td><img src="/assets/product-1.jpg" alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                      <td style={{fontWeight:600}}>MacBook Air M1 2020</td>
                      <td>Laptop</td>
                      <td>Lê Thị B</td>
                      <td><span className="status-badge approved">Đã duyệt</span></td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td><img src="/assets/product-1.jpg" alt="" style={{width:36, height:36, borderRadius:6, objectFit:'cover'}} /></td>
                      <td style={{fontWeight:600}}>Xe máy Honda Vision 2022</td>
                      <td>Xe cộ</td>
                      <td>Trần Văn C</td>
                      <td><span className="status-badge approved">Đã duyệt</span></td>
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
                      <th>Sản phẩm</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{fontWeight:600}}>#DH12546</td>
                      <td>Nguyễn Văn A</td>
                      <td>iPhone 14 Pro</td>
                      <td>3.500.000đ</td>
                      <td><span className="status-badge delivered">Đã giao</span></td>
                    </tr>
                    <tr>
                      <td style={{fontWeight:600}}>#DH12545</td>
                      <td>Lê Thị B</td>
                      <td>MacBook Air M1</td>
                      <td>11.000.000đ</td>
                      <td><span className="status-badge processing">Đang xử lý</span></td>
                    </tr>
                    <tr>
                      <td style={{fontWeight:600}}>#DH12544</td>
                      <td>Trần Văn C</td>
                      <td>Honda Vision</td>
                      <td>28.000.000đ</td>
                      <td><span className="status-badge delivered">Đã giao</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION CARDS */}
          <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4, 1fr)', marginTop:24}}>
            <div className="dashboard-card" style={{display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <h4 style={{fontSize:15, fontWeight:700, marginBottom:6}}>Bán hàng hiệu quả hơn</h4>
                <p style={{fontSize:13, color:'#64748b'}}>Quản lý tin đăng, đơn hàng, khách hàng.</p>
              </div>
              <Link href="/admin" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#00a65a', fontWeight:600, fontSize:13, marginTop:16}}>Xem chi tiết <ArrowRight size={14}/></Link>
            </div>

            <div className="dashboard-card" style={{display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <h4 style={{fontSize:15, fontWeight:700, marginBottom:6}}>Quản lý người dùng</h4>
                <p style={{fontSize:13, color:'#64748b'}}>Duyệt tài khoản, khóa/mở tài khoản.</p>
              </div>
              <Link href="/admin" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#00a65a', fontWeight:600, fontSize:13, marginTop:16}}>Xem chi tiết <ArrowRight size={14}/></Link>
            </div>

            <div className="dashboard-card" style={{display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <h4 style={{fontSize:15, fontWeight:700, marginBottom:6}}>Báo cáo & Thống kê</h4>
                <p style={{fontSize:13, color:'#64748b'}}>Dữ liệu chính xác, hỗ trợ ra quyết định.</p>
              </div>
              <Link href="/admin" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#00a65a', fontWeight:600, fontSize:13, marginTop:16}}>Xem báo cáo <ArrowRight size={14}/></Link>
            </div>

            <div className="dashboard-card" style={{display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
              <div>
                <h4 style={{fontSize:15, fontWeight:700, marginBottom:6}}>Cài đặt hệ thống</h4>
                <p style={{fontSize:13, color:'#64748b'}}>Cấu hình, phân quyền, bảo mật.</p>
              </div>
              <Link href="/admin/listing-templates" style={{display:'inline-flex', alignItems:'center', gap:6, color:'#00a65a', fontWeight:600, fontSize:13, marginTop:16}}>Xem cài đặt <ArrowRight size={14}/></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
