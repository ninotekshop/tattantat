import React from 'react';
import {
  Home, Building, Car, Bike, Smartphone, Laptop, Tv, Camera,
  Shirt, Briefcase, Wrench, Armchair, Utensils, BookOpen, Trophy,
  ShoppingBag, Package, Grid, Layers, Watch, Dumbbell, Gift, Music
} from 'lucide-react-native';
import { C } from './theme';

export function renderCategoryIcon(slug?: string, name?: string, size = 24, color = C.brand) {
  const s = (slug || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (s.includes('nha') || s.includes('dat') || s.includes('bat-dong-san') || n.includes('nhà') || n.includes('đất') || n.includes('bất động sản')) {
    return <Home size={size} color={color} />;
  }
  if (s.includes('xe') || n.includes('xe')) {
    return <Car size={size} color={color} />;
  }
  if (s.includes('dien-tu') || s.includes('cong-nghe') || s.includes('phone') || s.includes('may-tinh') || n.includes('điện tử') || n.includes('công nghệ') || n.includes('điện thoại') || n.includes('máy tính')) {
    return <Smartphone size={size} color={color} />;
  }
  if (s.includes('thoi-trang') || s.includes('quan-ao') || n.includes('thời trang') || n.includes('quần áo') || n.includes('giày') || n.includes('túi')) {
    return <Shirt size={size} color={color} />;
  }
  if (s.includes('viec-lam') || s.includes('tuyen-dung') || n.includes('việc làm') || n.includes('tuyển dụng') || n.includes('làm việc')) {
    return <Briefcase size={size} color={color} />;
  }
  if (s.includes('dich-vu') || s.includes('sua-chua') || n.includes('dịch vụ') || n.includes('sửa chữa')) {
    return <Wrench size={size} color={color} />;
  }
  if (s.includes('gia-dung') || s.includes('noi-that') || n.includes('gia dụng') || n.includes('nội thất') || n.includes('đồ gia dụng')) {
    return <Armchair size={size} color={color} />;
  }
  if (s.includes('giai-tri') || s.includes('the-thao') || n.includes('giải trí') || n.includes('thể thao')) {
    return <Trophy size={size} color={color} />;
  }
  if (s.includes('sach') || s.includes('giao-duc') || n.includes('sách') || n.includes('giáo dục')) {
    return <BookOpen size={size} color={color} />;
  }
  if (s.includes('tang') || s.includes('mien-phi') || n.includes('tặng') || n.includes('miễn phí')) {
    return <Gift size={size} color={color} />;
  }

  return <ShoppingBag size={size} color={color} />;
}
