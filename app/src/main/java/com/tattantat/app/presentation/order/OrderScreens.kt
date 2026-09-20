package com.tattantat.app.presentation.order

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.NumberFormat
import java.util.Locale

private fun vnd(value: String) = NumberFormat.getNumberInstance(Locale("vi", "VN")).format(value.toLongOrNull() ?: 0L) + " đ"
@Composable fun CheckoutScreen(productId: String, onConfirm: (String) -> Unit, vm: OrderViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    LaunchedEffect(productId) { vm.loadPreview(productId) }
    LaunchedEffect(state.orderCode) { state.orderCode?.let(onConfirm) }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Thanh toán", style = MaterialTheme.typography.headlineSmall)
        ListItem(headlineContent = { Text("Thanh toán khi nhận hàng") }, supportingContent = { Text("COD") })
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) { Text("Số lượng"); OutlinedButton(onClick = { vm.changeQuantity(productId, state.quantity - 1) }, enabled = state.quantity > 1 && !state.loading && state.pendingOrder == null) { Text("−") }; Text(state.quantity.toString()); OutlinedButton(onClick = { vm.changeQuantity(productId, state.quantity + 1) }, enabled = state.quantity < 1000 && !state.loading && state.pendingOrder == null) { Text("+") } }
        HorizontalDivider()
        state.price?.let { price -> Text("Giá sản phẩm: ${vnd(price.subtotal)}"); if (price.shippingFee != "0") Text("Phí vận chuyển: ${vnd(price.shippingFee)}"); Text("Tổng thanh toán: ${vnd(price.buyerTotal)}", style = MaterialTheme.typography.titleLarge) }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { vm.submitCod(productId, state.quantity) }, enabled = state.price != null && !state.loading, modifier = Modifier.fillMaxWidth()) { Text(if (state.loading) "Đang xử lý..." else if (state.pendingOrder != null) "Gửi lại yêu cầu COD" else "Xác nhận đặt hàng") }
    }
}
@Composable fun OrderConfirmationScreen(orderCode: String) = Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Text("Đặt hàng thành công", style = MaterialTheme.typography.headlineSmall); Text("Mã đơn #$orderCode") } }
