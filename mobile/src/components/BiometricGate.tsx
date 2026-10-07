import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { authenticateUser, biometricAvailable, biometricEnabled } from '@/lib/biometric';
import { C, R } from '@/lib/theme';

const RELOCK_AFTER_MS = 30_000;

/** Khóa phiên đăng nhập bằng vân tay: chỉ hoạt động khi người dùng bật trong Tài khoản. Không đổi cách đăng nhập. */
export function BiometricGate({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const [locked, setLocked] = useState(true), [checked, setChecked] = useState(false), [busy, setBusy] = useState(false);
  const leftAt = useRef(0), asking = useRef(false);

  const unlock = useCallback(async () => {
    if (asking.current) return; asking.current = true; setBusy(true);
    const ok = await authenticateUser();
    asking.current = false; setBusy(false);
    if (ok) setLocked(false);
  }, []);

  // Khi mở app (hoặc đăng nhập xong): kiểm tra có bật khóa không.
  useEffect(() => {
    let alive = true;
    if (!session) { setLocked(false); setChecked(true); return; }
    (async () => {
      const on = (await biometricEnabled()) && (await biometricAvailable());
      if (!alive) return;
      setChecked(true);
      if (on) { setLocked(true); void unlock(); } else setLocked(false);
    })();
    return () => { alive = false; };
  }, [session?.user.id, unlock]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quay lại app sau khi để nền > 30 giây thì khóa lại.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state === 'background') leftAt.current = Date.now();
      else if (state === 'active' && leftAt.current && Date.now() - leftAt.current > RELOCK_AFTER_MS && session) {
        leftAt.current = 0;
        if ((await biometricEnabled()) && (await biometricAvailable())) { setLocked(true); void unlock(); }
      }
    });
    return () => sub.remove();
  }, [session, unlock]);

  if (session && (!checked || locked)) {
    return (
      <View style={st.wrap}>
        <ShieldCheck size={64} color={C.brand} />
        <Text style={st.title}>Tất Tần Tật đang khóa</Text>
        <Text style={st.sub}>Dùng vân tay hoặc khuôn mặt để tiếp tục.</Text>
        {busy || !checked ? <ActivityIndicator color={C.brand} /> : (
          <Pressable onPress={() => void unlock()} style={st.btn}><Text style={st.btnText}>Mở khóa</Text></Pressable>
        )}
        <Pressable onPress={() => void signOut()} hitSlop={8}><Text style={st.out}>Đăng xuất</Text></Pressable>
      </View>
    );
  }
  return <>{children}</>;
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: C.ink },
  sub: { color: C.muted, textAlign: 'center' },
  btn: { backgroundColor: C.brand, borderRadius: R.md, paddingHorizontal: 28, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnText: { color: C.white, fontWeight: '800', fontSize: 16 },
  out: { color: C.muted, marginTop: 14, textDecorationLine: 'underline' },
});
