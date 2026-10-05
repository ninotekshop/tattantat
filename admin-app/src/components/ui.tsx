import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { C, R, shadow } from '@/lib/theme';
import { initials } from '@/lib/format';

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: {
  title: string; onPress?: () => void; variant?: 'primary' | 'outline' | 'ghost' | 'danger'; loading?: boolean; disabled?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  const v = variants[variant];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.btn, v.box, (disabled || loading) && { opacity: 0.5 }, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }, style]}>
      {loading ? <ActivityIndicator color={v.text.color} /> : <>{icon}<Text style={[s.btnText, v.text]}>{title}</Text></>}
    </Pressable>
  );
}
const variants: Record<string, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: C.brand, ...shadow }, text: { color: C.white } },
  outline: { box: { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.brand }, text: { color: C.brand } },
  ghost: { box: { backgroundColor: C.brandSoft }, text: { color: C.brandDark } },
  danger: { box: { backgroundColor: C.danger }, text: { color: C.white } },
};

export const Input = forwardRef<TextInput, TextInputProps & { label?: string; error?: string; right?: ReactNode; left?: ReactNode }>(
  function Input({ label, error, right, left, style, ...rest }, ref) {
    return (
      <View style={{ gap: 6 }}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <View style={[s.input, !!error && { borderColor: C.danger }]}>
          {left}
          <TextInput ref={ref} placeholderTextColor="#94A3B8" style={[s.inputText, style]} {...rest} />
          {right}
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </View>
    );
  });

export function Loading({ label }: { label?: string }) {
  return <View style={s.center}><ActivityIndicator size="large" color={C.brand} />{label ? <Text style={s.muted}>{label}</Text> : null}</View>;
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <View style={[s.center, { paddingVertical: 48 }]}>
      <Image source={require('../../assets/mascot.png')} style={{ width: 120, height: 120 }} contentFit="contain" />
      <Text style={s.emptyTitle}>{title}</Text>
      {text ? <Text style={[s.muted, { textAlign: 'center', paddingHorizontal: 24 }]}>{text}</Text> : null}
      {action}
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={s.errBox}>
      <Text style={{ color: C.danger, flex: 1 }}>{message}</Text>
      {onRetry ? <Text onPress={onRetry} style={{ color: C.brand, fontWeight: '700' }}>Thử lại</Text> : null}
    </View>
  );
}

export function Avatar({ name, url, size = 44 }: { name?: string | null; url?: string | null; size?: number }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.brandSoft }} />;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: C.white, fontWeight: '800', fontSize: size * 0.38 }}>{initials(name)}</Text>
  </View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.brand, borderColor: C.brand }]}>
    <Text style={[s.chipText, active && { color: C.white }]}>{label}</Text>
  </Pressable>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export const s = StyleSheet.create({
  btn: { minHeight: 50, borderRadius: R.pill, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: C.text },
  input: { minHeight: 50, borderWidth: 1.5, borderColor: C.line, borderRadius: R.md, backgroundColor: '#FBFDFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { flex: 1, fontSize: 16, color: C.ink, paddingVertical: 12 },
  error: { color: C.danger, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  muted: { color: C.muted, fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.ink, textAlign: 'center' },
  errBox: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: C.dangerSoft, borderRadius: R.md, padding: 12, margin: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white },
  chipText: { fontSize: 14, fontWeight: '600', color: C.text },
  card: { backgroundColor: C.white, borderRadius: R.lg, padding: 16, ...shadow },
});
