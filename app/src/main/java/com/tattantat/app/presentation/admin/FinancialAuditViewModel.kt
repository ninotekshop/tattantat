package com.tattantat.app.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.admin.AdminApi
import com.tattantat.app.data.remote.admin.FinancialAuditPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FinancialAuditUiState(val loading: Boolean = true, val logs: List<FinancialAuditPayload> = emptyList(), val error: String? = null)

@HiltViewModel
class FinancialAuditViewModel @Inject constructor(private val api: AdminApi) : ViewModel() {
    private val _state = MutableStateFlow(FinancialAuditUiState())
    val state = _state.asStateFlow()
    init { refresh() }
    fun refresh(entityType: String? = null) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { api.auditLogs(entityType = entityType).data.orEmpty() }
            .onSuccess { _state.value = FinancialAuditUiState(loading = false, logs = it) }
            .onFailure { _state.value = FinancialAuditUiState(loading = false, error = "Không thể tải nhật ký tài chính") }
    }
}
