/** So sánh gói Đẩy tin và gói VIP (Tin nổi bật) để người bán chọn đúng. */
export function PromoGuide() {
  const th = { textAlign: 'left' as const, padding: '8px 10px', background: '#f3f8f5', fontSize: 13 };
  const td = { padding: '8px 10px', borderTop: '1px solid #e3ece7', fontSize: 13.5, verticalAlign: 'top' as const };
  return <div style={{ margin: '4px 0 16px' }}>
    <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
      <thead><tr><th style={th} /><th style={th}>Đẩy tin</th><th style={th}>VIP (Tin nổi bật)</th></tr></thead>
      <tbody>
        <tr><td style={{ ...td, fontWeight: 700 }}>Tác dụng</td><td style={td}>Tin tự nhảy lên đầu danh sách mỗi 3 giờ trong suốt thời hạn gói.</td><td style={td}>Tin luôn nằm trên các tin thường trong danh mục và kết quả tìm kiếm.</td></tr>
        <tr><td style={{ ...td, fontWeight: 700 }}>Nhãn trên tin</td><td style={td}>Không có nhãn, tin hiện như tin mới đăng.</td><td style={td}>Có nhãn <b style={{ color: '#b45309' }}>VIP</b> nổi bật trên thẻ tin.</td></tr>
        <tr><td style={{ ...td, fontWeight: 700 }}>Phù hợp khi</td><td style={td}>Cần bán nhanh, tin bị chìm xuống sau nhiều tin mới.</td><td style={td}>Muốn tin gây chú ý và có độ tin cậy cao trong nhiều ngày.</td></tr>
      </tbody>
    </table></div>
    <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#4b5d56' }}><b>Gợi ý:</b> cần bán thật gấp thì mua cả hai gói cho cùng một tin: VIP giữ tin ở nhóm trên cùng, Đẩy tin giúp tin liên tục được làm mới trong nhóm đó.</p>
  </div>;
}
