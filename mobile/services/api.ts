import { Platform } from 'react-native';

const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_HOST}:3000/api/v1`;

export interface Product {
  id: string;
  title: string;
  price: number;
  location?: string;
  image_url?: string;
  category_id?: string;
  created_at?: string;
  seller_name?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  slug: string;
}

export const apiService = {
  async getProducts(params?: { categoryId?: string; search?: string }): Promise<Product[]> {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const res = await fetch(`${API_BASE_URL}/products?${query}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch (err) {
      console.warn('API Error, returning mock data:', err);
      return [
        {
          id: '1',
          title: 'Xe máy Honda SH 150i nhập khẩu chính hãng, mới 98%',
          price: 85000000,
          location: 'Quy Nhơn, Bình Định',
          image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500',
          seller_name: 'Minh Tuấn',
        },
        {
          id: '2',
          title: 'iPhone 15 Pro Max 256GB VN/A còn bảo hành',
          price: 27500000,
          location: 'Quy Nhơn, Bình Định',
          image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
          seller_name: 'Nguyễn Nam',
        },
        {
          id: '3',
          title: 'MacBook Pro M2 16inch RAM 16GB SSD 512GB',
          price: 34000000,
          location: 'Quy Nhơn, Bình Định',
          image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
          seller_name: 'Hải Đăng',
        },
      ];
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      if (!res.ok) throw new Error('Failed to fetch product detail');
      return await res.json();
    } catch (err) {
      return {
        id,
        title: 'Chó Poodle thuần chủng 2 tháng tuổi tiêm phòng đầy đủ',
        price: 4500000,
        location: 'Quy Nhơn, Bình Định',
        image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
        seller_name: 'Trại Chó Bình Định',
      };
    }
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: '1', name: 'Bất động sản', slug: 'bat-dong-san', icon: 'home' },
      { id: '2', name: 'Xe cộ', slug: 'xe-co', icon: 'car' },
      { id: '3', name: 'Đồ điện tử', slug: 'do-dien-tu', icon: 'smartphone' },
      { id: '4', name: 'Thú cưng', slug: 'thu-cung', icon: 'dog' },
      { id: '5', name: 'Đồ gia dụng', slug: 'do-gia-dung', icon: 'tv' },
      { id: '6', name: 'Thời trang', slug: 'thoi-trang', icon: 'shopping-bag' },
    ];
  },
};
