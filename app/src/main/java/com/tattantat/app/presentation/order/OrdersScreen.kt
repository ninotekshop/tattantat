package com.tattantat.app.presentation.order

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.data.remote.order.OrderSummaryPayload
import java.text.NumberFormat
import java.util.Locale

private fun orderVnd(value: String) = NumberFormat.getNumberInstance(Locale("vi", "VN")).format(value.toLongOrNull() ?: 0L) + " đ"
@Composable fun OrdersScreen(vm: OrdersViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var refunding by remember { mutableStateOf<OrderSummaryPayload?>(null) }
    var refundAmount by remember { mutableStateOf("") }
    var refundReason by remember { mutableStateOf("") }
    var refundHistoryFor by remember { mutableStateOf<OrderSummaryPayload?>(null) }
    var priceFor by remember { mutableStateOf<OrderSummaryPayload?>(null) }
    var cancelling by remember { mutableStateOf<OrderSummaryPayload?>(null) }
    var reviewing by remember { mutableStateOf<OrderSummaryPayload?>(null) }
    var reviewRating by remember { mutableStateOf("5") }
    var reviewComment by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Đơn hàng", style = MaterialTheme.typography.headlineSmall)
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        LazyColumn { items(state.orders, key = { it.id }) { order ->
            ListItem(headlineContent = { Text(order.order_code) }, supportingContent = { Text("${order.order_status} · ${order.payment_status}") }, trailingContent = { Text(orderVnd(order.total_amount)) })
            TextButton(onClick = { priceFor = order; vm.loadPrice(order) }) { Text("Chi tiết thanh toán") }
            val next = when (order.order_status) { "PENDING" -> "CONFIRMED"; "CONFIRMED" -> "PREPARING"; "PREPARING" -> "SHIPPING"; "SHIPPING" -> "DELIVERED"; else -> null }
            if (order.seller_id == state.userId && next != null) TextButton(onClick = { vm.transition(order,next) }) { Text(when(next){"CONFIRMED"->"Xác nhận";"PREPARING"->"Chuẩn bị";"SHIPPING"->"Giao hàng";else->"Đã giao"}) }
            if (order.seller_id == state.userId && order.order_status in setOf("PENDING", "CONFIRMED")) TextButton(onClick = { cancelling = order }) { Text("Hủy đơn") }
            if (order.seller_id == state.userId && order.order_status == "DELIVERED") Button(onClick = { vm.complete(order) }) { Text("Hoàn tất đơn") }
            if (order.seller_id == state.userId && order.order_status == "COMPLETED" && order.payment_status != "REFUNDED") {
                TextButton(onClick = { refunding = order; refundAmount = ""; refundReason = "" }) { Text("Hoàn tiền") }
            }
            if (order.buyer_id == state.userId && order.order_status == "COMPLETED" && order.review_id == null) {
                TextButton(onClick = { reviewing = order; reviewRating = "5"; reviewComment = "" }) { Text("Đánh giá người bán") }
            }
            if (order.order_status == "COMPLETED" || order.payment_status.contains("REFUND")) {
                TextButton(onClick = { refundHistoryFor = order; vm.loadRefunds(order) }) { Text("Lịch sử hoàn") }
            }
            if (order.buyer_id == state.userId && order.order_status == "PENDING") TextButton(onClick = { cancelling = order }) { Text("Hủy đơn") }
            HorizontalDivider()
        } }
        if (!state.loading && state.orders.isEmpty()) Text("Chưa có đơn hàng", Modifier.padding(top = 24.dp))
    }
    cancelling?.let { order ->
        AlertDialog(
            onDismissRequest = { cancelling = null },
            title = { Text("Hủy đơn ${order.order_code}?") },
            text = { Text("Đơn sẽ bị hủy và tin đăng được mở lại để người khác có thể mua.") },
            confirmButton = { TextButton(onClick = { vm.transition(order, "CANCELLED"); cancelling = null }) { Text("Xác nhận hủy") } },
            dismissButton = { TextButton(onClick = { cancelling = null }) { Text("Quay lại") } },
        )
    }
    reviewing?.let { order ->
        AlertDialog(
            onDismissRequest = { reviewing = null },
            title = { Text("Đánh giá đơn ${order.order_code}") },
            text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Đánh giá của bạn chỉ được gửi một lần sau khi đơn hoàn tất.")
                OutlinedTextField(reviewRating, { reviewRating = it.filter(Char::isDigit).take(1) }, label = { Text("Số sao (1–5)") }, singleLine = true)
                OutlinedTextField(reviewComment, { reviewComment = it }, label = { Text("Nhận xét (không bắt buộc)") }, minLines = 2)
            } },
            confirmButton = { TextButton(onClick = { reviewRating.toIntOrNull()?.takeIf { it in 1..5 }?.let { vm.review(order, it, reviewComment); reviewing = null } }) { Text("Gửi đánh giá") } },
            dismissButton = { TextButton(onClick = { reviewing = null }) { Text("Hủy") } },
        )
    }
    refunding?.let { order ->
        AlertDialog(
            onDismissRequest = { refunding = null },
            title = { Text("Hoàn tiền ${order.order_code}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Để trống số tiền để hoàn toàn bộ phần còn lại. Hệ thống tự tạo bút toán đảo, không sửa giao dịch gốc.")
                    OutlinedTextField(refundAmount, { refundAmount = it.filter(Char::isDigit) }, label = { Text("Số tiền hoàn (VND)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    OutlinedTextField(refundReason, { refundReason = it }, label = { Text("Lý do hoàn tiền") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                }
            },
            confirmButton = {
                TextButton(onClick = { vm.refund(order, refundAmount.ifBlank { null }, refundReason.ifBlank { null }); refunding = null }) { Text("Xác nhận hoàn tiền") }
            },
            dismissButton = { TextButton(onClick = { refunding = null }) { Text("Hủy") } },
        )
    }
    refundHistoryFor?.let { order ->
        val refunds = state.refunds[order.id].orEmpty()
        AlertDialog(
            onDismissRequest = { refundHistoryFor = null },
            title = { Text("Hoàn tiền ${order.order_code}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (state.loadingRefundId == order.id) LinearProgressIndicator(Modifier.fillMaxWidth())
                    if (state.loadingRefundId != order.id && refunds.isEmpty()) Text("Chưa có giao dịch hoàn tiền.")
                    refunds.forEach { refund ->
                        Text("${refund.type} · ${orderVnd(refund.amount)} · ${refund.status}")
                        refund.reason?.takeIf { it.isNotBlank() }?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { refundHistoryFor = null }) { Text("Đóng") } },
        )
    }
    priceFor?.let { order ->
        val price = state.financialSnapshots[order.id]
        AlertDialog(
            onDismissRequest = { priceFor = null },
            title = { Text("Chi tiết ${order.order_code}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (state.loadingPriceId == order.id) LinearProgressIndicator(Modifier.fillMaxWidth())
                    price?.let {
                        Text("Giá hàng: ${orderVnd(it.subtotal)}")
                        Text("Giảm giá: ${orderVnd(it.discount)}")
                        Text("Phí vận chuyển: ${orderVnd(it.shippingFee)}")
                        Text("Tổng người mua thanh toán: ${orderVnd(it.buyerTotal)}", style = MaterialTheme.typography.titleMedium)
                        if (order.seller_id == state.userId) {
                            Text("Phí nền tảng: ${orderVnd(it.platformFee)} (${it.platformFeeRateBps / 100.0}%)")
                            Text("Phí thanh toán: ${orderVnd(it.paymentFee)}")
                            Text("Khoản người bán nhận: ${orderVnd(it.sellerPayout)}", style = MaterialTheme.typography.titleMedium)
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { priceFor = null }) { Text("Đóng") } },
        )
    }
}
