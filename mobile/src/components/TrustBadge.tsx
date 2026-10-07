import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { C, R } from '@/lib/theme';

export type TrustCriterion = { key: string; label: string; completed: boolean; points: number; maxPoints: number };
export type TrustData = { score: number; maxScore: number; stars: number; level: string; criteria: TrustCriterion[] };

export const TRUST_TOOLTIP = 'Điểm uy tín phản ánh mức độ xác thực và hoạt động của thành viên trên Tất Tần Tật. Điểm càng cao cho thấy tài khoản đã hoàn thiện nhiều tiêu chí xác thực và có lịch sử hoạt động tốt hơn.';

const cache = new Map<string, { at: number; p: Promise<TrustData | null> }>();
function loadTrust(userId: string): Promise<TrustData | null> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < 60_000) return hit.p;
  const p = api<TrustData>(`/users/${encodeURIComponent(userId)}/trust-score`, { auth: false }).catch(() => null);
  cache.set(userId, { at: Date.now(), p });
  return p;
}

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <Text style={{ fontSize: size, letterSpacing: 1, color: '#F5A623' }} accessibilityLabel={`${n} trên 5 sao`}>
      {'★'.repeat(n)}<Text style={{ color: '#D6DBD8' }}>{'★'.repeat(5 - n)}</Text>
    </Text>
  );
}

/** Huy hiệu điểm uy tín; bấm để mở Bottom Sheet chi tiết tiêu chí. compact: "★★★★☆ 8/10". */
export default function TrustBadge({ userId, compact }: { userId?: string | null; compact?: boolean }) {
  const [data, setData] = useState<TrustData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    void loadTrust(userId).then(d => { if (live) setData(d); });
    return () => { live = false; };
  }, [userId]);

  if (!data) return null;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }} accessibilityRole="button" accessibilityLabel={`${data.score} trên ${data.maxScore} điểm uy tín, ${data.level}`}>
        <Stars n={data.stars} size={compact ? 12 : 15} />
        <Text style={{ fontWeight: '700', fontSize: compact ? 12 : 13, color: C.text }}>{data.score}/{data.maxScore}{compact ? '' : ' điểm uy tín'}</Text>
        {!compact && <Text style={{ fontSize: 12, fontWeight: '600', color: C.brandDark, backgroundColor: C.brandSoft, borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' }}>{data.level}</Text>}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,.5)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '88%' }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
              <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, marginBottom: 14 }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: '800', color: C.muted }}>ĐIỂM UY TÍN</Text>
                <View style={{ marginVertical: 6 }}><Stars n={data.stars} size={30} /></View>
                <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink }}>{data.score}/{data.maxScore}</Text>
                <Text style={{ fontWeight: '700', color: C.brandDark }}>{data.level}</Text>
              </View>
              <View style={{ marginTop: 16, gap: 10 }}>
                {data.criteria.map(c => (
                  <View key={c.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Text style={{ flex: 1, fontSize: 14, color: c.completed ? C.ink : '#94A3B8' }}>
                      <Text style={{ fontWeight: '800', color: c.completed ? C.brand : '#CBD5E1' }}>{c.completed ? '✓  ' : '✗  '}</Text>{c.label}
                    </Text>
                    <Text style={{ fontWeight: '700', color: c.completed ? C.ink : '#94A3B8' }}>{c.completed ? `+${c.points}` : `0/${c.maxPoints}`}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ marginTop: 16, fontSize: 13, color: C.text }}>Hoàn thiện thêm các tiêu chí để tăng mức độ uy tín của tài khoản.</Text>
              <Text style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 17 }}>{TRUST_TOOLTIP}</Text>
              <Pressable onPress={() => setOpen(false)} style={{ marginTop: 16, backgroundColor: C.brand, borderRadius: R.md, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: C.white, fontWeight: '700' }}>Đóng</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
