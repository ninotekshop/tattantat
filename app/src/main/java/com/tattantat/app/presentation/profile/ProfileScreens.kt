package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.HorizontalDivider
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
import java.text.NumberFormat
import java.util.Locale

private fun profileVnd(value: String) = NumberFormat.getNumberInstance(Locale("vi", "VN")).format(value.toLongOrNull() ?: 0L) + " đ"

@Composable
fun ProfileScreen(
    onOrders: () -> Unit = {},
    onWallet: () -> Unit = {},
    onSubscriptions: () -> Unit = {},
    onAdmin: () -> Unit = {},
    onFavorites: () -> Unit = {},
    onListings: () -> Unit = {},
    onNotifications: () -> Unit = {},
    onReviews: () -> Unit = {},
    onBlockedUsers: () -> Unit = {},
    onLogout: () -> Unit = {},
    vm: ProfileViewModel = hiltViewModel(),
) {
    val state by vm.state.collectAsState()
    var editing by remember { mutableStateOf(false) }
    var confirmingLogout by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(state.name.ifBlank { "Đang tải hồ sơ" }, style = MaterialTheme.typography.headlineSmall)
                Text(state.contact)
            }
            TextButton(onClick = { name = state.name; editing = true }) { Text("Chỉnh sửa") }
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        Spacer(Modifier.height(16.dp))

        ListItem(
            headlineContent = { Text("Ví người bán", style = MaterialTheme.typography.titleMedium) },
            supportingContent = { Text("Khả dụng: ${profileVnd(state.availableBalance)} · Chờ: ${profileVnd(state.pendingBalance)}") },
            trailingContent = { TextButton(onWallet) { Text("Quản lý") } },
        )
        if (state.heldBalance != "0") Text("Đang giữ để rút: ${profileVnd(state.heldBalance)}")
        ListItem(headlineContent = { Text("Gói Shop") }, trailingContent = { TextButton(onSubscriptions) { Text("Xem gói") } })
        if (state.role == "ADMIN" || state.role == "SUPER_ADMIN") {
            HorizontalDivider()
            ListItem(
                headlineContent = { Text("Quản trị tài chính") },
                supportingContent = { Text("Doanh thu và hàng đợi xử lý") },
                trailingContent = { TextButton(onAdmin) { Text("Mở") } },
            )
        }
        Spacer(Modifier.height(12.dp))
        ListItem(headlineContent = { Text("Tin đăng của tôi") }, trailingContent = { TextButton(onListings) { Text("Xem") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Sản phẩm yêu thích") }, trailingContent = { TextButton(onFavorites) { Text("Xem") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Đơn hàng") }, trailingContent = { TextButton(onOrders) { Text("Xem") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Thông báo") }, trailingContent = { TextButton(onNotifications) { Text("Xem") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Đánh giá") }, trailingContent = { TextButton(onReviews) { Text("Xem") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Người dùng đã chặn") }, trailingContent = { TextButton(onBlockedUsers) { Text("Quản lý") } })
        HorizontalDivider()
        ListItem(headlineContent = { Text("Cài đặt") })
        HorizontalDivider()
        Button(
            onClick = { confirmingLogout = true },
            enabled = !state.loggingOut,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
        ) { Text(if (state.loggingOut) "Đang đăng xuất..." else "Đăng xuất") }
    }

    if (editing) {
        AlertDialog(
            onDismissRequest = { if (!state.saving) editing = false },
            title = { Text("Chỉnh sửa hồ sơ") },
            text = { OutlinedTextField(name, { name = it }, label = { Text("Họ và tên") }, singleLine = true) },
            confirmButton = { TextButton(onClick = { vm.updateName(name); editing = false }, enabled = !state.saving && name.trim().length >= 2) { Text("Lưu") } },
            dismissButton = { TextButton(onClick = { editing = false }, enabled = !state.saving) { Text("Hủy") } },
        )
    }
    if (confirmingLogout) {
        AlertDialog(
            onDismissRequest = { if (!state.loggingOut) confirmingLogout = false },
            title = { Text("Đăng xuất?") },
            text = { Text("Phiên đăng nhập trên thiết bị này sẽ được kết thúc.") },
            confirmButton = { TextButton(onClick = { vm.logout(onLogout) }, enabled = !state.loggingOut) { Text("Đăng xuất") } },
            dismissButton = { TextButton(onClick = { confirmingLogout = false }, enabled = !state.loggingOut) { Text("Hủy") } },
        )
    }
}
