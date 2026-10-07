import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY = 'tattantat.biometric.v1';
/** Máy có cảm biến vân tay/khuôn mặt và đã cài đặt sinh trắc học. */
export async function biometricAvailable(): Promise<boolean> {
  try { return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync()); } catch { return false; }
}
export async function biometricEnabled(): Promise<boolean> {
  try { return (await SecureStore.getItemAsync(KEY)) === '1'; } catch { return false; }
}
export async function setBiometricEnabled(on: boolean) {
  if (on) await SecureStore.setItemAsync(KEY, '1'); else await SecureStore.deleteItemAsync(KEY);
}
/** Hỏi vân tay/khuôn mặt (cho phép dùng mã khóa màn hình nếu sinh trắc học thất bại). */
export async function authenticateUser(reason = 'Mở khóa Tất Tần Tật'): Promise<boolean> {
  try { return (await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Hủy', fallbackLabel: 'Dùng mã khóa' })).success; } catch { return false; }
}
