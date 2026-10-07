import * as Haptics from 'expo-haptics';

/** Rung nhẹ khi chạm (thanh điều hướng, danh mục, nút lọc). Lỗi/thiết bị không hỗ trợ thì bỏ qua. */
export const tap = () => { Haptics.selectionAsync().catch(() => undefined); };
