import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

export default function SellScreen() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title || !price) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tiêu đề và giá sản phẩm.');
      return;
    }
    Alert.alert('Thành công', 'Tin đăng của bạn đã được gửi phê duyệt!');
    setTitle('');
    setPrice('');
    setDescription('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Hình ảnh sản phẩm (Tối đa 6 ảnh)</Text>
      <View style={styles.imagePickerRow}>
        <TouchableOpacity style={styles.imagePickerBtn}>
          <Camera size={24} color={COLORS.brand} />
          <Text style={styles.imagePickerText}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imagePickerBtn}>
          <ImageIcon size={24} color={COLORS.brand} />
          <Text style={styles.imagePickerText}>Chọn từ thư viện</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Tiêu đề tin đăng *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: iPhone 15 Pro Max 256GB mới 99%"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Giá rao bán (VND) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập giá bán (VD: 5000000)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Mô tả chi tiết sản phẩm</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Mô tả tình trạng, xuất xứ, phụ kiện đi kèm..."
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Đăng tin ngay</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: COLORS.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 14,
    backgroundColor: COLORS.paper,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.brand,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: COLORS.brandLight,
  },
  imagePickerText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.brand,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  submitBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.white,
  },
});
