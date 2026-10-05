import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { C, R } from '@/lib/theme';
import { Button } from '@/components/ui';

/** Nút Duyệt / Từ chối; từ chối bắt buộc nhập lý do (người dùng sẽ nhận được thông báo). */
export function ReviewActions({ busy, onApprove, onReject, approveLabel = 'Duyệt' }: { busy?: boolean; onApprove: () => void; onReject: (reason: string) => void; approveLabel?: string }) {
  const [rejecting, setRejecting] = useState(false), [reason, setReason] = useState('');
  if (rejecting) {
    return (
      <View style={{ gap: 8 }}>
        <TextInput value={reason} onChangeText={setReason} multiline placeholder="Lý do từ chối (người dùng sẽ nhận được thông báo)…" placeholderTextColor="#9F1239" style={st.input} />
        <View style={st.row}>
          <Button variant="outline" title="Hủy" onPress={() => { setRejecting(false); setReason(''); }} style={st.btn} />
          <Button variant="danger" title="Gửi từ chối" loading={busy} disabled={reason.trim().length < 3} onPress={() => onReject(reason.trim())} style={[st.btn, { flex: 1.4 }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={st.row}>
      <Button variant="outline" title="Từ chối" onPress={() => setRejecting(true)} style={[st.btn, { borderColor: C.danger }]} />
      <Button title={approveLabel} loading={busy} onPress={onApprove} style={[st.btn, { backgroundColor: C.brandDark }]} />
    </View>
  );
}
const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, minHeight: 44 },
  input: { minHeight: 70, borderWidth: 1, borderColor: '#FBCFD8', backgroundColor: C.dangerSoft, borderRadius: R.md, padding: 12, fontSize: 14, color: '#9F1239', textAlignVertical: 'top' },
});
