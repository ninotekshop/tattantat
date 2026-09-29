import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

const CATEGORIES = [
  { id: '1', name: 'Bất động sản', desc: 'Mua bán nhà đất, căn hộ cho thuê' },
  { id: '2', name: 'Xe cộ', desc: 'Ô tô, xe máy, xe điện, phụ tùng' },
  { id: '3', name: 'Đồ điện tử', desc: 'Điện thoại, máy tính, máy ảnh, phụ kiện' },
  { id: '4', name: 'Thú cưng', desc: 'Chó, mèo, thức ăn & phụ kiện thú cưng' },
  { id: '5', name: 'Đồ gia dụng', desc: 'Bàn ghế, tủ, đồ dùng bếp, máy giặt' },
  { id: '6', name: 'Thời trang', desc: 'Quần áo, giày dép, túi xách, đồng hồ' },
];

export default function CategoriesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{item.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.brand,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    color: COLORS.ink,
  },
  desc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
});
