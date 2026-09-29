import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Bell } from 'lucide-react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { apiService, Product, Category } from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([
      apiService.getProducts(),
      apiService.getCategories(),
    ]);
    setProducts(prods);
    setCategories(cats);
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MapPin size={16} color={COLORS.brand} />
          <Text style={styles.locationText}>Quy Nhơn, Bình Định</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={20} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm mọi thứ trên Tất Tần Tật..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* BANNER */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Tất Tần Tật</Text>
          <Text style={styles.bannerSubtitle}>Mua bán mọi thứ, đơn giản và an toàn gần bạn</Text>
        </View>

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <View style={styles.categoryIconBg}>
                <Text style={styles.categoryIconText}>{cat.name[0]}</Text>
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* PRODUCT LIST */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tin đăng mới nhất</Text>
        </View>

        <View style={styles.productList}>
          {products.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.productCard}
              onPress={() => router.push(`/products/${item.id}`)}
            >
              <Image source={{ uri: item.image_url }} style={styles.productImg} />
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.productPrice}>{formatVnd(item.price)}</Text>
                <Text style={styles.productLocation}>{item.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.ink,
  },
  iconBtn: {
    padding: 6,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    color: COLORS.ink,
  },
  banner: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
  },
  bannerTitle: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.white,
  },
  bannerSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.brandLight,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.ink,
  },
  categoriesRow: {
    paddingLeft: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  categoryIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.brand,
  },
  categoryName: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: COLORS.ink,
    textAlign: 'center',
  },
  productList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  productImg: {
    width: 110,
    height: 110,
  },
  productInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    color: COLORS.ink,
    lineHeight: 18,
  },
  productPrice: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.brand,
  },
  productLocation: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: COLORS.muted,
  },
});
