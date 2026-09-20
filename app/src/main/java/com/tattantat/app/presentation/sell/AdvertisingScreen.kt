package com.tattantat.app.presentation.sell

import androidx.compose.foundation.layout.*
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
import java.text.NumberFormat
import java.util.Locale

private fun adsVnd(v:String)=NumberFormat.getNumberInstance(Locale("vi","VN")).format(v.toLongOrNull()?:0L)+" đ"
@Composable fun AdvertisingScreen(productId:String,vm:AdvertisingViewModel=hiltViewModel()){val state by vm.state.collectAsState();var budget by remember{mutableStateOf("")};Column(Modifier.fillMaxSize().padding(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){Text("Quảng cáo sản phẩm",style=MaterialTheme.typography.headlineSmall);Text("Sponsored Product · Fixed price");OutlinedTextField(budget,{budget=it.filter(Char::isDigit)},label={Text("Ngân sách VND")},modifier=Modifier.fillMaxWidth());Button(onClick={vm.create(productId,budget)},enabled=budget.isNotBlank()&&!state.loading,modifier=Modifier.fillMaxWidth()){Text(if(state.loading)"Đang tạo..." else "Tạo campaign")};state.error?.let{Text(it,color=MaterialTheme.colorScheme.error)};state.message?.let{Text(it,color=MaterialTheme.colorScheme.primary)};Text("Campaign của bạn",style=MaterialTheme.typography.titleMedium);state.campaigns.filter{it.product_id==productId}.forEach{campaign->ListItem(headlineContent={Text(adsVnd(campaign.budget))},supportingContent={Text(campaign.status)})}}}
