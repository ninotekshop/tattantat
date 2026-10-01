import { router } from 'expo-router';
import { Button, Empty } from './ui';

export function LoginRequired({ text }: { text: string }) {
  return <Empty title="Bạn chưa đăng nhập" text={text} action={<Button title="Đăng nhập / Đăng ký" onPress={() => router.push('/login')} style={{ marginTop: 12, minWidth: 220 }} />} />;
}
