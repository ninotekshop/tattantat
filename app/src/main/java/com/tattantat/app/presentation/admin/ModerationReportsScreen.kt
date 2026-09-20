package com.tattantat.app.presentation.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
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
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.admin.AdminApi
import com.tattantat.app.data.remote.admin.AdminReportPayload
import com.tattantat.app.data.remote.admin.UpdateReportRequest
import com.tattantat.app.data.remote.admin.ModerationNoteRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ModerationReportsState(val loading: Boolean = true, val status: String = "OPEN", val items: List<AdminReportPayload> = emptyList(), val savingId: String? = null, val error: String? = null)

@HiltViewModel
class ModerationReportsViewModel @Inject constructor(private val api: AdminApi) : ViewModel() {
    private val _state = MutableStateFlow(ModerationReportsState())
    val state = _state.asStateFlow()
    init { refresh() }
    fun refresh(status: String = _state.value.status) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, status = status, error = null)
        runCatching { api.reports(status).data ?: emptyList() }
            .onSuccess { _state.value = _state.value.copy(loading = false, items = it) }
            .onFailure { _state.value = _state.value.copy(loading = false, error = "Không thể tải báo cáo") }
    }
    fun update(item: AdminReportPayload, status: String, note: String) = viewModelScope.launch {
        _state.value = _state.value.copy(savingId = item.id, error = null)
        runCatching {
            if (status == "HIDE_PRODUCT") api.hideReportedProduct(item.id, ModerationNoteRequest(note.trim().ifBlank { null })).data
            else api.updateReport(item.id, UpdateReportRequest(status, note.trim().ifBlank { null })).data
                ?: error("Không thể cập nhật")
        }
            .onSuccess { refresh(_state.value.status) }
            .onFailure { _state.value = _state.value.copy(savingId = null, error = "Không thể cập nhật báo cáo") }
    }
}

@Composable
fun ModerationReportsScreen(vm: ModerationReportsViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var action by remember { mutableStateOf<Pair<AdminReportPayload, String>?>(null) }
    var note by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Duyệt báo cáo", style = MaterialTheme.typography.headlineSmall)
        listOf("OPEN" to "Mới", "REVIEWING" to "Đang xem", "RESOLVED" to "Đã xử lý", "REJECTED" to "Từ chối").forEach { (value, label) ->
            FilterChip(selected = state.status == value, onClick = { vm.refresh(value) }, label = { Text(label) })
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        when {
            state.loading -> CircularProgressIndicator()
            state.items.isEmpty() -> Text("Không có báo cáo trong trạng thái này.")
            else -> state.items.forEach { report ->
                ListItem(
                    headlineContent = { Text("${report.reason} · ${report.reported_user_name ?: "Tin đăng"}") },
                    supportingContent = { Text(listOfNotNull(report.product_title, report.details, "Gửi bởi ${report.reporter_name}").joinToString("\n")) },
                    trailingContent = {
                        if (report.status == "OPEN" || report.status == "REVIEWING") Column {
                            TextButton(onClick = { action = report to if (report.status == "OPEN") "REVIEWING" else "RESOLVED" }) { Text(if (report.status == "OPEN") "Nhận xử lý" else "Đã xử lý") }
                            if (report.product_id != null) TextButton(onClick = { action = report to "HIDE_PRODUCT" }) { Text("Ẩn tin") }
                            TextButton(onClick = { action = report to "REJECTED" }) { Text("Từ chối") }
                        } else Text(report.status)
                    },
                )
            }
        }
    }
    action?.let { (report, status) ->
        AlertDialog(
            onDismissRequest = { action = null; note = "" },
            title = { Text(when (status) { "REVIEWING" -> "Nhận xử lý báo cáo"; "REJECTED" -> "Từ chối báo cáo"; "HIDE_PRODUCT" -> "Ẩn tin đăng vi phạm"; else -> "Đóng báo cáo" }) },
            text = { OutlinedTextField(note, { note = it }, label = { Text("Ghi chú nội bộ") }, modifier = Modifier.fillMaxWidth(), minLines = 2) },
            confirmButton = { TextButton(onClick = { vm.update(report, status, note); action = null; note = "" }, enabled = state.savingId == null) { Text("Xác nhận") } },
            dismissButton = { TextButton(onClick = { action = null; note = "" }, enabled = state.savingId == null) { Text("Hủy") } },
        )
    }
}
