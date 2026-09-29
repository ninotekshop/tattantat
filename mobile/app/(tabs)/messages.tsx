import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

const MOCK_CHATS = [
  {
    id: '1',
    name: 'Trại Chó Bình Định',
    lastMessage: 'Dạ chú Poodle còn bạn nhé, bạn có muốn qua xem trực tiếp không?',
    time: '10:15',
    unread: 1,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    id: '2',
    name: 'Nguyễn Nam',
    lastMessage: 'Cảm ơn bạn, mình đã nhận được hàng rồi!',
    time: 'Hôm qua',
    unread: 0,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
];

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatCard}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>
                {item.lastMessage}
              </Text>
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
    backgroundColor: COLORS.white,
  },
  chatCard: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.ink,
  },
  time: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
  lastMsg: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.muted,
  },
});
