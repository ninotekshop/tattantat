package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.data.remote.admin.PricingRulePayload

@Composable fun AdminPricingScreen(vm:AdminPricingViewModel=hiltViewModel()){val state by vm.state.collectAsState();var selected by remember{mutableStateOf<PricingRulePayload?>(null)};var percent by remember{mutableStateOf("")};var reason by remember{mutableStateOf("")};Column(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){Text("Biểu phí giao dịch",style=MaterialTheme.typography.headlineSmall);Text("Đơn cũ luôn giữ snapshot phí tại thời điểm tạo.",style=MaterialTheme.typography.bodySmall);if(state.loading)LinearProgressIndicator(Modifier.fillMaxWidth());state.rules.forEach{rule->ListItem(headlineContent={Text(rule.code)},supportingContent={Text("Đang áp dụng: ${(rule.rate_bps?:0)/100}% · ${rule.reason?:"Chưa có phiên bản"}")},trailingContent={TextButton(onClick={selected=rule;percent=((rule.rate_bps?:0)/100).toString();reason=""}){Text("Đổi")}})};state.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};state.message?.let{Text(it,color=MaterialTheme.colorScheme.primary)}};selected?.let{rule->AlertDialog(onDismissRequest={if(!state.saving)selected=null},title={Text("Đổi ${rule.code}")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(percent,{percent=it.filter(Char::isDigit)},label={Text("Phần trăm phí (0–100)")},singleLine=true);OutlinedTextField(reason,{reason=it},label={Text("Lý do thay đổi")},minLines=2)}},confirmButton={TextButton(onClick={vm.save(rule.code,percent.toIntOrNull()?:-1,reason);selected=null},enabled=!state.saving&&reason.trim().length>=3){Text("Tạo phiên bản")}},dismissButton={TextButton(onClick={selected=null},enabled=!state.saving){Text("Hủy")}})}}
