package com.tattantat.app.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.admin.AdminApi
import com.tattantat.app.data.remote.admin.AdminTransactionPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

data class AdminTransactionsUiState(
    val loading: Boolean = true,
    val transactions: List<AdminTransactionPayload> = emptyList(),
    val error: String? = null,
    val type: String? = null,
    val from: String = "",
    val to: String = "",
)

@HiltViewModel
class AdminTransactionsViewModel @Inject constructor(private val api: AdminApi) : ViewModel() {
    private val _state = MutableStateFlow(AdminTransactionsUiState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh(
        type: String? = _state.value.type,
        from: String = _state.value.from,
        to: String = _state.value.to,
    ) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching {
            val start = from.takeIf { it.isNotBlank() }?.let { "${LocalDate.parse(it)}T00:00:00+07:00" }
            val end = to.takeIf { it.isNotBlank() }?.let { "${LocalDate.parse(it).plusDays(1)}T00:00:00+07:00" }
            api.transactions(type = type, from = start, to = end).data.orEmpty()
        }
            .onSuccess { _state.value = AdminTransactionsUiState(loading = false, transactions = it, type = type, from = from, to = to) }
            .onFailure { _state.value = AdminTransactionsUiState(loading = false, type = type, from = from, to = to, error = "Không thể tải sổ cái giao dịch") }
    }
}
