package com.tattantat.app.presentation.profile

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

private fun planVnd(v:String)=NumberFormat.getNumberInstance(Locale("vi","VN")).format(v.toLongOrNull()?:0L)+" đ/tháng"
@Composable fun SubscriptionScreen(vm:SubscriptionViewModel=hiltViewModel()){val state by vm.state.collectAsState();Column(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Gói Shop",style=MaterialTheme.typography.headlineSmall);state.active?.let{Text("Đang dùng: ${it.name}",color=MaterialTheme.colorScheme.primary)};state.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};state.message?.let{Text(it,color=MaterialTheme.colorScheme.primary)};state.plans.forEach{plan->Card{Column(Modifier.padding(14.dp)){Text(plan.name,style=MaterialTheme.typography.titleMedium);Text(planVnd(plan.price));Text("Tối đa: ${plan.max_listings?:"Không giới hạn"} tin");Button(onClick={vm.purchase(plan.id)},enabled=!state.loading){Text(if(plan.price=="0")"Dùng miễn phí" else "Chọn gói")}}}}}}
