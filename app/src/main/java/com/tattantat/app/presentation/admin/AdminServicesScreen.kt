package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.tattantat.app.data.remote.admin.PromotionPackageAdminPayload
import com.tattantat.app.data.remote.admin.SubscriptionPlanAdminPayload

private sealed interface ServiceEdit { data class Promotion(val item: PromotionPackageAdminPayload) : ServiceEdit; data class Subscription(val item: SubscriptionPlanAdminPayload) : ServiceEdit }

@Composable
fun AdminServicesScreen(onCreate: () -> Unit = {}, vm: AdminServicesViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var editing by remember { mutableStateOf<ServiceEdit?>(null) }
    var price by remember { mutableStateOf("") }
    var reason by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Giá dịch vụ", style = MaterialTheme.typography.headlineSmall)
        TextButton(onClick = onCreate) { Text("Tạo gói mới") }
        Text("Mỗi thay đổi tạo một phiên bản mới; giao dịch cũ không bị ảnh hưởng.", style = MaterialTheme.typography.bodySmall)
        if (state.loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        Text("Đẩy tin & VIP", style = MaterialTheme.typography.titleMedium)
        state.promotions.forEach { item ->
            ListItem(
                headlineContent = { Text(item.name) },
                supportingContent = { Text("${item.price ?: "—"} đ · ${item.duration_hours ?: 0} giờ · ${item.promotion_type ?: ""}") },
                trailingContent = { TextButton(onClick = { editing = ServiceEdit.Promotion(item); price = item.price.orEmpty(); reason = "" }) { Text("Đổi giá") } },
            )
        }
        Text("Gói Shop", style = MaterialTheme.typography.titleMedium)
        state.subscriptions.forEach { item ->
            ListItem(
                headlineContent = { Text(item.name) },
                supportingContent = { Text("${item.price ?: "—"} đ · ${item.billing_cycle ?: "MONTHLY"} · tối đa ${item.max_listings ?: "không giới hạn"} tin") },
                trailingContent = { TextButton(onClick = { editing = ServiceEdit.Subscription(item); price = item.price.orEmpty(); reason = "" }) { Text("Đổi giá") } },
            )
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
    editing?.let { edit ->
        val label = when (edit) { is ServiceEdit.Promotion -> edit.item.name; is ServiceEdit.Subscription -> edit.item.name }
        AlertDialog(
            onDismissRequest = { if (!state.saving) editing = null },
            title = { Text("Đổi giá $label") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = price, onValueChange = { price = it.filter(Char::isDigit) }, label = { Text("Giá VND") }, singleLine = true)
                    OutlinedTextField(value = reason, onValueChange = { reason = it }, label = { Text("Lý do thay đổi") }, minLines = 2)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    when (edit) {
                        is ServiceEdit.Promotion -> vm.savePromotion(edit.item, price, reason)
                        is ServiceEdit.Subscription -> vm.saveSubscription(edit.item, price, reason)
                    }
                    editing = null
                }, enabled = !state.saving && reason.trim().length >= 3) { Text("Tạo phiên bản") }
            },
            dismissButton = { TextButton(onClick = { editing = null }, enabled = !state.saving) { Text("Hủy") } },
        )
    }
}
