package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun AdminCreateServiceScreen(vm: AdminServicesViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var kind by remember { mutableStateOf("PROMOTION") }
    var code by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf("168") }
    var promotionType by remember { mutableStateOf("FEATURED") }
    var cycle by remember { mutableStateOf("MONTHLY") }
    var maxListings by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Tạo gói dịch vụ", style = MaterialTheme.typography.headlineSmall)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = kind == "PROMOTION", onClick = { kind = "PROMOTION" }, label = { Text("Đẩy tin/VIP") })
            FilterChip(selected = kind == "SUBSCRIPTION", onClick = { kind = "SUBSCRIPTION" }, label = { Text("Gói Shop") })
        }
        OutlinedTextField(code, { code = it.uppercase().filter { char -> char.isLetterOrDigit() || char == '_' } }, label = { Text("Mã gói, ví dụ VIP_90D") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(name, { name = it }, label = { Text("Tên gói") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(price, { price = it.filter(Char::isDigit) }, label = { Text("Giá VND") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        if (kind == "PROMOTION") {
            OutlinedTextField(duration, { duration = it.filter(Char::isDigit) }, label = { Text("Thời lượng (giờ)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = promotionType == "FEATURED", onClick = { promotionType = "FEATURED" }, label = { Text("VIP") })
                FilterChip(selected = promotionType == "BOOST", onClick = { promotionType = "BOOST" }, label = { Text("Đẩy tin") })
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = cycle == "MONTHLY", onClick = { cycle = "MONTHLY" }, label = { Text("Theo tháng") })
                FilterChip(selected = cycle == "YEARLY", onClick = { cycle = "YEARLY" }, label = { Text("Theo năm") })
            }
            OutlinedTextField(maxListings, { maxListings = it.filter(Char::isDigit) }, label = { Text("Giới hạn tin đăng, để trống nếu không giới hạn") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        }
        OutlinedTextField(reason, { reason = it }, label = { Text("Lý do tạo gói") }, minLines = 2, modifier = Modifier.fillMaxWidth())
        Button(
            onClick = {
                if (kind == "PROMOTION") vm.createPromotion(code, name, price, duration.toIntOrNull() ?: 0, promotionType, reason)
                else vm.createSubscription(code, name, price, cycle, maxListings.toIntOrNull(), reason)
            },
            enabled = !state.saving && code.length >= 3 && name.isNotBlank() && price.isNotBlank() && reason.trim().length >= 3,
            modifier = Modifier.fillMaxWidth(),
        ) { Text(if (state.saving) "Đang tạo..." else "Tạo gói") }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}
