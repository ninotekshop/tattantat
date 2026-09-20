package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
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
import com.tattantat.app.data.remote.admin.CommercialQueuePayload
import com.tattantat.app.data.remote.admin.AdminPayoutPayload
import com.tattantat.app.data.remote.admin.ShippingPendingPayload
import com.tattantat.app.data.remote.admin.WalletReleasePendingPayload
import java.text.NumberFormat
import java.util.Locale

fun adminVnd(value: String) = NumberFormat.getNumberInstance(Locale("vi", "VN"))
    .format(value.toLongOrNull() ?: 0L) + " đ"
private data class PayoutAction(val payout: AdminPayoutPayload, val status: String)
private data class ShippingAction(val order: ShippingPendingPayload, val providerCost: String = "")
private data class WalletReleaseAction(val item: WalletReleasePendingPayload)

@Composable
fun AdminScreen(onPricing: () -> Unit = {}, onServices: () -> Unit = {}, onTransactions: () -> Unit = {}, onAudit: () -> Unit = {}, onReports: () -> Unit = {}, vm: AdminViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var confirmation by remember { mutableStateOf<CommercialQueuePayload?>(null) }
    var payoutConfirmation by remember { mutableStateOf<PayoutAction?>(null) }
    var shippingConfirmation by remember { mutableStateOf<ShippingAction?>(null) }
    var walletReleaseConfirmation by remember { mutableStateOf<WalletReleaseAction?>(null) }
    var reportFrom by remember { mutableStateOf("") }
    var reportTo by remember { mutableStateOf("") }
    Column(
        Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Quản trị tài chính", style = MaterialTheme.typography.headlineSmall)
            Row {
                TextButton(onClick = onPricing) { Text("Biểu phí") }
                TextButton(onClick = onServices) { Text("Dịch vụ") }
                TextButton(onClick = onTransactions) { Text("Sổ cái") }
                TextButton(onClick = onAudit) { Text("Nhật ký") }
                TextButton(onClick = onReports) { Text("Báo cáo") }
                TextButton(onClick = vm::refresh) { Text("Làm mới") }
            }
        }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Text("Báo cáo: ${state.reportLabel}", style = MaterialTheme.typography.titleMedium)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = { vm.presetRange("Hôm nay", 1) }) { Text("Hôm nay") }
            TextButton(onClick = { vm.presetRange("7 ngày", 7) }) { Text("7 ngày") }
            TextButton(onClick = { vm.presetRange("30 ngày", 30) }) { Text("30 ngày") }
            TextButton(onClick = { vm.refresh(null, null, "Toàn bộ thời gian") }) { Text("Tất cả") }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(reportFrom, { reportFrom = it }, label = { Text("Từ YYYY-MM-DD") }, modifier = Modifier.weight(1f), singleLine = true)
            OutlinedTextField(reportTo, { reportTo = it }, label = { Text("Đến YYYY-MM-DD") }, modifier = Modifier.weight(1f), singleLine = true)
        }
        TextButton(onClick = { vm.customRange(reportFrom, reportTo) }, enabled = reportFrom.isNotBlank() && reportTo.isNotBlank()) { Text("Áp dụng khoảng ngày") }
        state.revenue?.let { revenue ->
            Card {
                Column(Modifier.padding(14.dp)) {
                    Text("Tổng quan")
                    Text("GMV: ${adminVnd(revenue.gmv)}")
                    Text("Doanh thu ròng: ${adminVnd(revenue.net_revenue)}")
                    Text("Phí nền tảng: ${adminVnd(revenue.platform_revenue)} · Phí cổng thanh toán: ${adminVnd(revenue.payment_processing_cost)}")
                    Text("Đẩy tin: ${adminVnd(revenue.promotion_revenue)} · Gói shop: ${adminVnd(revenue.subscription_revenue)}")
                    Text("Quảng cáo: ${adminVnd(revenue.advertising_revenue)} · Biên vận chuyển: ${adminVnd(revenue.shipping_margin)}")
                    Text("Chi trả người bán: ${adminVnd(revenue.seller_payout)} · Hoàn tiền: ${adminVnd(revenue.refund_volume)}")
                    Text("Đơn hoàn tất: ${revenue.total_orders}")
                }
            }
        }
        state.reconciliation?.let { reconciliation ->
            Card {
                Column(Modifier.padding(14.dp)) {
                    Text(
                        if (reconciliation.balanced) "Đối soát: cân bằng" else "Đối soát: cần xử lý",
                        color = if (reconciliation.balanced) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    )
                    Text("Journal kiểm tra: ${reconciliation.checked?.finalized_transactions ?: 0} · Lỗi: ${reconciliation.errors.size}")
                }
            }
        }
        Text("Hàng đợi xử lý (${state.queue.size})", style = MaterialTheme.typography.titleMedium)
        state.queue.take(8).forEach { item ->
            ListItem(
                headlineContent = { Text("${item.kind} · ${adminVnd(item.amount)}") },
                supportingContent = { Text("${item.seller_name} · ${item.product_name}") },
                trailingContent = {
                    if (item.status == "PENDING" || item.status == "PENDING_PAYMENT") {
                        TextButton(onClick = { confirmation = item }, enabled = state.settlingId == null) {
                            Text(if (state.settlingId == item.id) "Đang chốt" else "Chốt")
                        }
                    } else Text(item.status)
                },
            )
        }
        if (state.payouts.isNotEmpty()) {
            Text("Yêu cầu rút tiền (${state.payouts.size})", style = MaterialTheme.typography.titleMedium)
            state.payouts.take(6).forEach { payout ->
                val nextStatus = if (payout.status == "REQUESTED") "PROCESSING" else "COMPLETED"
                ListItem(
                    headlineContent = { Text("${payout.sellerName} · ${adminVnd(payout.netAmount)}") },
                    supportingContent = { Text("${payout.bankName ?: "Ngân hàng"} · ****${payout.accountNumberLast4 ?: ""}") },
                    trailingContent = {
                        TextButton(onClick = { payoutConfirmation = PayoutAction(payout, nextStatus) }, enabled = state.settlingId == null) {
                            Text(if (state.settlingId == payout.id) "Đang xử lý" else if (nextStatus == "PROCESSING") "Xử lý" else "Đã chuyển")
                        }
                    },
                )
            }
        }
        if (state.shipping.isNotEmpty()) {
            Text("Đối soát vận chuyển (${state.shipping.size})", style = MaterialTheme.typography.titleMedium)
            state.shipping.take(6).forEach { order ->
                ListItem(
                    headlineContent = { Text("${order.order_code} · Khách trả ${adminVnd(order.customer_fee)}") },
                    supportingContent = { Text("${order.seller_name} → ${order.buyer_name}") },
                    trailingContent = {
                        TextButton(
                            onClick = { shippingConfirmation = ShippingAction(order) },
                            enabled = state.settlingId == null,
                        ) {
                            Text(if (state.settlingId == order.id) "Đang chốt" else "Đối soát")
                        }
                    },
                )
            }
        }
        if (state.walletReleases.isNotEmpty()) {
            Text("Chuyển vào ví khả dụng (${state.walletReleases.size})", style = MaterialTheme.typography.titleMedium)
            state.walletReleases.take(6).forEach { item ->
                ListItem(
                    headlineContent = { Text("${item.order_code} · ${adminVnd(item.amount)}") },
                    supportingContent = { Text(item.seller_name) },
                    trailingContent = { TextButton(onClick = { walletReleaseConfirmation = WalletReleaseAction(item) }, enabled = state.settlingId == null) { Text(if (state.settlingId == item.id) "Đang chuyển" else "Release") } },
                )
            }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
    confirmation?.let { item ->
        AlertDialog(
            onDismissRequest = { if (state.settlingId == null) confirmation = null },
            title = { Text("Xác nhận chốt thanh toán") },
            text = { Text("${item.kind} sẽ được ghi nhận ${adminVnd(item.amount)} vào ledger và kích hoạt dịch vụ. Thao tác này không thể hoàn tác tại đây.") },
            confirmButton = {
                TextButton(onClick = { vm.settle(item); confirmation = null }, enabled = state.settlingId == null) { Text("Xác nhận") }
            },
            dismissButton = { TextButton(onClick = { confirmation = null }, enabled = state.settlingId == null) { Text("Hủy") } },
        )
    }
    payoutConfirmation?.let { action ->
        val completing = action.status == "COMPLETED"
        AlertDialog(
            onDismissRequest = { if (state.settlingId == null) payoutConfirmation = null },
            title = { Text(if (completing) "Xác nhận đã chuyển ngân hàng" else "Bắt đầu xử lý payout") },
            text = { Text(if (completing) "Chỉ xác nhận sau khi ngân hàng đã chuyển ${adminVnd(action.payout.netAmount)} thành công. Hệ thống sẽ chốt ledger payout." else "Số dư đang giữ sẽ tiếp tục ở trạng thái chờ chuyển ngân hàng.") },
            confirmButton = { TextButton(onClick = { vm.transitionPayout(action.payout, action.status); payoutConfirmation = null }, enabled = state.settlingId == null) { Text("Xác nhận") } },
            dismissButton = { TextButton(onClick = { payoutConfirmation = null }, enabled = state.settlingId == null) { Text("Hủy") } },
        )
    }
    shippingConfirmation?.let { action ->
        val customerFee = action.order.customer_fee.toLongOrNull() ?: 0L
        val providerCost = action.providerCost.toLongOrNull() ?: 0L
        AlertDialog(
            onDismissRequest = { if (state.settlingId == null) shippingConfirmation = null },
            title = { Text("Đối soát vận chuyển") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${action.order.order_code}: khách đã trả ${adminVnd(action.order.customer_fee)}.")
                    androidx.compose.material3.OutlinedTextField(
                        value = action.providerCost,
                        onValueChange = { value -> shippingConfirmation = action.copy(providerCost = value.filter(Char::isDigit)) },
                        label = { Text("Chi phí thực trả đơn vị vận chuyển (đ)") },
                        singleLine = true,
                    )
                    Text("Biên lợi nhuận vận chuyển: ${adminVnd((customerFee - providerCost).toString())}")
                }
            },
            confirmButton = {
                TextButton(
                    onClick = { vm.settleShipping(action.order, action.providerCost); shippingConfirmation = null },
                    enabled = state.settlingId == null && action.providerCost.isNotBlank(),
                ) { Text("Xác nhận") }
            },
            dismissButton = { TextButton(onClick = { shippingConfirmation = null }, enabled = state.settlingId == null) { Text("Hủy") } },
        )
    }
    walletReleaseConfirmation?.let { action ->
        AlertDialog(
            onDismissRequest = { if (state.settlingId == null) walletReleaseConfirmation = null },
            title = { Text("Chuyển tiền vào ví khả dụng") },
            text = { Text("Chuyển ${adminVnd(action.item.amount)} của đơn ${action.item.order_code} vào số dư khả dụng của ${action.item.seller_name}. Chỉ xác nhận khi đã hết thời hạn hoàn/tranh chấp.") },
            confirmButton = { TextButton(onClick = { vm.releaseWallet(action.item); walletReleaseConfirmation = null }, enabled = state.settlingId == null) { Text("Xác nhận") } },
            dismissButton = { TextButton(onClick = { walletReleaseConfirmation = null }, enabled = state.settlingId == null) { Text("Hủy") } },
        )
    }
}
