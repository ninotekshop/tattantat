package com.tattantat.app.presentation.order

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable fun CheckoutScreen(onConfirm: () -> Unit) { Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) { Text("Thanh toán", style = MaterialTheme.typography.headlineSmall); ListItem(headlineContent = { Text("Địa chỉ giao hàng") }, supportingContent = { Text("Quy Nhơn, Bình Định") }); ListItem(headlineContent = { Text("Thanh toán khi nhận hàng") }, supportingContent = { Text("COD") }); HorizontalDivider(); Text("Tổng cộng: 18.500.000 đ", style = MaterialTheme.typography.titleLarge); Button(onClick = onConfirm, Modifier.fillMaxWidth()) { Text("Xác nhận đặt hàng") } } }
@Composable fun OrderConfirmationScreen() = Box(Modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) { Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) { Text("Đặt hàng thành công", style = MaterialTheme.typography.headlineSmall); Text("Mã đơn #TTT-1001") } }
