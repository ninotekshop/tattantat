package com.tattantat.app.presentation.notification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.NotificationPayload
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotificationsUiState(val loading: Boolean = true, val items: List<NotificationPayload> = emptyList(), val error: String? = null)

@HiltViewModel
class NotificationsViewModel @Inject constructor(private val api: AccountApi) : ViewModel() {
    private val _state = MutableStateFlow(NotificationsUiState())
    val state = _state.asStateFlow()
    init { refresh() }
    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { api.notifications().data.orEmpty() }
            .onSuccess { _state.value = NotificationsUiState(loading = false, items = it) }
            .onFailure { _state.value = NotificationsUiState(loading = false, error = "Không thể tải thông báo") }
    }
    fun read(item: NotificationPayload) = viewModelScope.launch {
        if (item.is_read) return@launch
        runCatching { api.readNotification(item.id) }
            .onSuccess { _state.value = _state.value.copy(items = _state.value.items.map { if (it.id == item.id) it.copy(is_read = true) else it }) }
    }
    fun readAll() = viewModelScope.launch {
        runCatching { api.readAllNotifications() }.onSuccess { _state.value = _state.value.copy(items = _state.value.items.map { it.copy(is_read = true) }) }
    }
}
