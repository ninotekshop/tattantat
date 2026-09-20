package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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

@Composable
fun AdminTransactionsScreen(vm: AdminTransactionsViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var from by remember { mutableStateOf("") }
    var to by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Sổ cái giao dịch", style = MaterialTheme.typography.headlineSmall)
        Text("Chỉ hiển thị journal đã ghi nhận; tổng Nợ và Có của từng journal phải bằng nhau.", style = MaterialTheme.typography.bodySmall)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = { vm.refresh(type = null, from = from, to = to) }) { Text("Tất cả") }
            TextButton(onClick = { vm.refresh(type = "ORDER_PAYMENT", from = from, to = to) }) { Text("Đơn hàng") }
            TextButton(onClick = { vm.refresh(type = "REFUND", from = from, to = to) }) { Text("Hoàn tiền") }
            TextButton(onClick = { vm.refresh(type = "PAYOUT", from = from, to = to) }) { Text("Rút tiền") }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(from, { from = it }, label = { Text("Từ YYYY-MM-DD") }, modifier = Modifier.weight(1f), singleLine = true)
            OutlinedTextField(to, { to = it }, label = { Text("Đến YYYY-MM-DD") }, modifier = Modifier.weight(1f), singleLine = true)
        }
        TextButton(onClick = { vm.refresh(from = from, to = to) }) { Text("Áp dụng lọc ngày") }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        state.transactions.forEach { transaction ->
            val balanced = transaction.total_debit == transaction.total_credit && transaction.balance == "0"
            ListItem(
                headlineContent = { Text("${transaction.type} · ${transaction.status}") },
                supportingContent = {
                    Text("Nợ ${adminVnd(transaction.total_debit)} · Có ${adminVnd(transaction.total_credit)} · ${if (balanced) "Cân bằng" else "Cần kiểm tra"}")
                },
                trailingContent = { Text(transaction.created_at.take(10)) },
            )
        }
        if (!state.loading && state.transactions.isEmpty() && state.error == null) Text("Chưa có giao dịch ledger.")
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
