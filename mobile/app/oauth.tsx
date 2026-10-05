import { useEffect } from 'react';
import { router } from 'expo-router';

/** Địa chỉ quay về sau khi đăng nhập Facebook/Zalo (tattantat://oauth?code=…). Kết quả do màn đăng nhập xử lý nên ở đây chỉ quay lại, tránh hiện trang "không tìm thấy". */
export default function OAuthReturn() {
  useEffect(() => { if (router.canGoBack()) router.back(); else router.replace('/'); }, []);
  return null;
}
