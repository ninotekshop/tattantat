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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun FinancialAuditScreen(vm: FinancialAuditViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Nhật ký tài chính", style = MaterialTheme.typography.headlineSmall)
        Text("Mọi thay đổi nhạy cảm đều được lưu kèm người thực hiện, thời điểm và lý do.", style = MaterialTheme.typography.bodySmall)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(onClick = { vm.refresh() }) { Text("Tất cả") }
            TextButton(onClick = { vm.refresh("PRICING_RULE") }) { Text("Biểu phí") }
            TextButton(onClick = { vm.refresh("PAYOUT") }) { Text("Payout") }
            TextButton(onClick = { vm.refresh("REFUND") }) { Text("Hoàn tiền") }
        }
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        state.logs.forEach { log ->
            ListItem(
                headlineContent = { Text(log.action.replace('_', ' ')) },
                supportingContent = { Text("${log.entity_type} · ${log.reason ?: "Không có lý do"}") },
                trailingContent = { Text(log.created_at.take(10)) },
            )
        }
        if (!state.loading && state.logs.isEmpty() && state.error == null) Text("Chưa có nhật ký phù hợp.")
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
