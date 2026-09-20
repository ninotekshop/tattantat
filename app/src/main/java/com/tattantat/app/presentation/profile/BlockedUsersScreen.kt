package com.tattantat.app.presentation.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
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
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.BlockedUserPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BlockedUsersState(val loading: Boolean = true, val items: List<BlockedUserPayload> = emptyList(), val error: String? = null)

@HiltViewModel
class BlockedUsersViewModel @Inject constructor(private val api: AccountApi) : ViewModel() {
    private val _state = MutableStateFlow(BlockedUsersState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { api.blocks().data ?: emptyList() }
            .onSuccess { _state.value = BlockedUsersState(loading = false, items = it) }
            .onFailure { _state.value = _state.value.copy(loading = false, error = "Không thể tải danh sách đã chặn") }
    }

    fun unblock(userId: String) = viewModelScope.launch {
        runCatching { api.unblockUser(userId) }
            .onSuccess { _state.value = _state.value.copy(items = _state.value.items.filterNot { it.id == userId }) }
            .onFailure { _state.value = _state.value.copy(error = "Không thể bỏ chặn. Vui lòng thử lại.") }
    }
}

@Composable
fun BlockedUsersScreen(vm: BlockedUsersViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var selected by remember { mutableStateOf<BlockedUserPayload?>(null) }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Người dùng đã chặn", style = MaterialTheme.typography.headlineSmall)
        Text("Họ không thể nhắn tin cho bạn và tin đăng của họ sẽ bị ẩn.", style = MaterialTheme.typography.bodyMedium)
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        when {
            state.loading -> CircularProgressIndicator()
            state.items.isEmpty() -> Text("Bạn chưa chặn người dùng nào.")
            else -> state.items.forEach { user ->
                ListItem(
                    headlineContent = { Text(user.full_name) },
                    supportingContent = { Text("Đã chặn") },
                    trailingContent = { TextButton(onClick = { selected = user }) { Text("Bỏ chặn") } },
                )
            }
        }
        Spacer(Modifier.height(4.dp))
        TextButton(onClick = vm::refresh, modifier = Modifier.fillMaxWidth(), enabled = !state.loading) { Text("Làm mới") }
    }
    selected?.let { user ->
        AlertDialog(
            onDismissRequest = { selected = null },
            title = { Text("Bỏ chặn ${user.full_name}?") },
            text = { Text("Người này có thể nhìn thấy tin đăng và liên hệ với bạn trở lại.") },
            confirmButton = { TextButton(onClick = { vm.unblock(user.id); selected = null }) { Text("Bỏ chặn") } },
            dismissButton = { TextButton(onClick = { selected = null }) { Text("Hủy") } },
        )
    }
}
