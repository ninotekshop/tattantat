import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS } from '../../constants/theme';
import { apiService, Product } from '../../services/api';
import { MapPin, Phone, MessageSquare, Share2 } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      apiService.getProductById(id).then((data) => {
        setProduct(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: product.image_url }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.price}>{formatVnd(product.price)}</Text>
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.locationRow}>
            <MapPin size={16} color={COLORS.muted} />
            <Text style={styles.locationText}>{product.location}</Text>
          </View>

          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {product.seller_name ? product.seller_name[0] : 'S'}
              </Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller_name || 'Người bán'}</Text>
              <Text style={styles.sellerSub}>Thành viên đã xác thực</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionBtnOutline}>
          <MessageSquare size={18} color={COLORS.brand} />
          <Text style={styles.actionTextOutline}>Chat ngay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnSolid}>
          <Phone size={18} color={COLORS.white} />
          <Text style={styles.actionTextSolid}>Gọi điện</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 280,
  },
  content: {
    padding: 16,
  },
  price: {
    fontFamily: FONTS.extraBold,
    fontSize: 22,
    color: COLORS.brand,
    marginBottom: 6,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.ink,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paper,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.white,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.ink,
  },
  sellerSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: COLORS.muted,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brand,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionTextOutline: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.brand,
  },
  actionBtnSolid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionTextSolid: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.white,
  },
});
