package com.tattantat.app.presentation.sell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.text.NumberFormat
import java.util.Locale

private fun promotionVnd(v:String)=NumberFormat.getNumberInstance(Locale("vi","VN")).format(v.toLongOrNull()?:0L)+" đ"
@Composable fun PromotionScreen(productId:String,vm:PromotionViewModel=hiltViewModel()){val state by vm.state.collectAsState();Column(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Đẩy tin / VIP",style=MaterialTheme.typography.headlineSmall);Text("Chọn gói; tin chỉ được kích hoạt sau khi thanh toán được xác nhận.");state.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};state.message?.let{Text(it,color=MaterialTheme.colorScheme.primary)};state.packages.forEach{pack->Card{Column(Modifier.padding(14.dp)){Text(pack.name,style=MaterialTheme.typography.titleMedium);Text("${promotionVnd(pack.price)} · ${pack.duration_hours} giờ");Button(onClick={vm.purchase(productId,pack.id)},enabled=!state.loading){Text("Chọn gói")}}}}}}
