import { useEffect, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { api } from '@/lib/api';
import { C, R } from '@/lib/theme';

type Summary = { code: string; pending: number; qualified: number };

/** Mã giới thiệu của tôi + nhập mã của người đã giới thiệu mình. */
export default function ReferralCard() {
  const [s, setS] = useState<Summary | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { api<Summary>('/me/referral', { auth: true }).then(setS).catch(() => undefined); }, []);

  const invite = () => { if (s) void Share.share({ message: `Tham gia Tất Tần Tật cùng mình, nhập mã giới thiệu ${s.code} tại https://tattantat.vn` }); };

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      await api('/me/referral', { method: 'POST', auth: true, body: { code: code.trim() } });
      setMsg({ ok: true, text: 'Đã ghi nhận mã giới thiệu. Người giới thiệu sẽ được cộng điểm uy tín khi tài khoản của bạn đã xác thực số điện thoại.' });
      setCode('');
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Không áp dụng được mã giới thiệu.' }); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ backgroundColor: C.white, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink }}>Giới thiệu bạn bè</Text>
      <Text style={{ color: C.muted, fontSize: 13 }}>Mỗi người bạn đăng ký và xác thực số điện thoại giúp tăng điểm uy tín của bạn.</Text>
      {s ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: 3, color: C.brandDark, backgroundColor: C.brandSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: R.md, overflow: 'hidden' }}>{s.code}</Text>
          <Pressable onPress={invite} style={{ borderWidth: 1, borderColor: C.brand, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 7 }}>
            <Text style={{ color: C.brandDark, fontWeight: '700' }}>Chia sẻ</Text>
          </Pressable>
          <Text style={{ color: C.muted, fontSize: 12 }}>{s.qualified} đã xác thực · {s.pending} đang chờ</Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>Bạn được ai giới thiệu? Nhập mã của họ</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput value={code} onChangeText={t => setCode(t.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 8))} placeholder="Ví dụ: A1B2C3D4" autoCapitalize="characters" autoCorrect={false} maxLength={8}
          style={{ flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, letterSpacing: 2, fontWeight: '700', color: C.ink }} />
        <Pressable disabled={busy || code.length !== 8} onPress={submit} style={{ backgroundColor: busy || code.length !== 8 ? '#9ADBBD' : C.brand, borderRadius: R.md, paddingHorizontal: 16, justifyContent: 'center' }}>
          <Text style={{ color: C.white, fontWeight: '700' }}>{busy ? '...' : 'Áp dụng'}</Text>
        </Pressable>
      </View>
      {msg ? <Text style={{ fontSize: 13, color: msg.ok ? C.brandDark : C.danger }}>{msg.text}</Text> : null}
    </View>
  );
}
