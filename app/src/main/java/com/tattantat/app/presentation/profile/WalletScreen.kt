package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.data.remote.account.SellerPayoutPayload
import java.text.NumberFormat
import java.util.Locale

private fun walletVnd(value: String) = NumberFormat.getNumberInstance(Locale("vi", "VN")).format(value.toLongOrNull() ?: 0L) + " đ"

@Composable
fun WalletScreen(vm: WalletViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var amount by remember { mutableStateOf("") }
    var bank by remember { mutableStateOf("") }
    var holder by remember { mutableStateOf("") }
    var number by remember { mutableStateOf("") }
    var defaultAccount by remember { mutableStateOf(false) }
    var cancelling by remember { mutableStateOf<SellerPayoutPayload?>(null) }
    var choosingAccount by remember { mutableStateOf(false) }
    var selectedAccountId by remember { mutableStateOf<String?>(null) }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Ví người bán", style = MaterialTheme.typography.headlineSmall)
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Card {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Khả dụng: ${walletVnd(state.wallet.availableBalance)}", style = MaterialTheme.typography.titleLarge)
                Text("Chờ hoàn tất đơn: ${walletVnd(state.wallet.pendingBalance)} · Đang giữ: ${walletVnd(state.wallet.heldBalance)}")
            }
        }
        state.revenue?.let { revenue ->
            Card {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Doanh thu người bán", style = MaterialTheme.typography.titleMedium)
                    Text("Đã phát sinh: ${walletVnd(revenue.grossSellerPayout)} · Đã hoàn: ${walletVnd(revenue.refundedSellerPayout)}")
                    Text("Đã rút: ${walletVnd(revenue.withdrawn)}")
                }
            }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        HorizontalDivider()
        Text("Tài khoản nhận tiền", style = MaterialTheme.typography.titleMedium)
        state.accounts.forEach { account -> ListItem(headlineContent = { Text(account.bankName) }, supportingContent = { Text("${account.accountHolder} · ${account.accountNumberMasked}") }) }
        OutlinedTextField(bank, { bank = it }, label = { Text("Ngân hàng") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(holder, { holder = it }, label = { Text("Chủ tài khoản") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(number, { number = it.filter(Char::isLetterOrDigit) }, label = { Text("Số tài khoản") }, modifier = Modifier.fillMaxWidth())
        Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) { Checkbox(checked = defaultAccount, onCheckedChange = { defaultAccount = it }); Text("Đặt làm tài khoản mặc định") }
        OutlinedButton(onClick = { vm.addAccount(bank, holder, number, defaultAccount) }, enabled = bank.isNotBlank() && holder.isNotBlank() && number.length >= 6) { Text("Thêm tài khoản") }
        HorizontalDivider()
        Text("Rút tiền", style = MaterialTheme.typography.titleMedium)
        OutlinedTextField(amount, { amount = it.filter(Char::isDigit) }, label = { Text("Số tiền muốn rút (VND)") }, modifier = Modifier.fillMaxWidth())
        val selectedAccount = state.accounts.firstOrNull { it.id == selectedAccountId } ?: state.accounts.firstOrNull()
        OutlinedButton(onClick = { choosingAccount = true }, enabled = state.accounts.isNotEmpty(), modifier = Modifier.fillMaxWidth()) { Text("Nhận tại: ${selectedAccount?.bankName ?: "Chọn tài khoản"}") }
        Button(onClick = { vm.payout(amount, selectedAccount?.id) }, enabled = amount.isNotBlank() && selectedAccount != null, modifier = Modifier.fillMaxWidth()) { Text("Gửi yêu cầu rút tiền") }
        if (state.payouts.isNotEmpty()) {
            Text("Lịch sử rút tiền", style = MaterialTheme.typography.titleMedium)
            state.payouts.take(8).forEach { payout ->
                ListItem(
                    headlineContent = { Text("${walletVnd(payout.netAmount)} · ${payout.status}") },
                    supportingContent = { Text("Yêu cầu: ${payout.requestedAt.take(10)}") },
                    trailingContent = { if (payout.status == "REQUESTED") TextButton(onClick = { cancelling = payout }) { Text("Hủy") } },
                )
            }
        }
    }
    cancelling?.let { payout ->
        AlertDialog(
            onDismissRequest = { cancelling = null },
            title = { Text("Hủy yêu cầu rút tiền?") },
            text = { Text("${walletVnd(payout.netAmount)} sẽ được trả về số dư khả dụng.") },
            confirmButton = { TextButton(onClick = { vm.cancelPayout(payout); cancelling = null }) { Text("Hủy yêu cầu") } },
            dismissButton = { TextButton(onClick = { cancelling = null }) { Text("Quay lại") } },
        )
    }
    if (choosingAccount) {
        AlertDialog(
            onDismissRequest = { choosingAccount = false },
            title = { Text("Chọn tài khoản nhận tiền") },
            text = {
                Column {
                    state.accounts.forEach { account ->
                        TextButton(onClick = { selectedAccountId = account.id; choosingAccount = false }, modifier = Modifier.fillMaxWidth()) {
                            Text("${account.bankName} · ${account.accountNumberMasked}")
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { choosingAccount = false }) { Text("Đóng") } },
        )
    }
}
