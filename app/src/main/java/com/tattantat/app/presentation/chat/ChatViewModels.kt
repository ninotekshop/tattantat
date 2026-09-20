package com.tattantat.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.chat.ChatApi
import com.tattantat.app.data.remote.chat.ChatMessagePayload
import com.tattantat.app.data.remote.chat.ChatPayload
import com.tattantat.app.data.remote.chat.SendMessageRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatListUiState(val loading: Boolean = true, val chats: List<ChatPayload> = emptyList(), val error: String? = null)

@HiltViewModel
class ChatListViewModel @Inject constructor(private val api: ChatApi) : ViewModel() {
    private val _state = MutableStateFlow(ChatListUiState())
    val state = _state.asStateFlow()
    init { refresh() }
    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { api.chats().data.orEmpty() }
            .onSuccess { _state.value = ChatListUiState(loading = false, chats = it) }
            .onFailure { _state.value = ChatListUiState(loading = false, error = "Không thể tải tin nhắn") }
    }
}

data class ChatDetailUiState(val loading: Boolean = true, val messages: List<ChatMessagePayload> = emptyList(), val ownUserId: String = "", val sending: Boolean = false, val error: String? = null)

@HiltViewModel
class ChatDetailViewModel @Inject constructor(private val api: ChatApi, private val accountApi: AccountApi) : ViewModel() {
    private val _state = MutableStateFlow(ChatDetailUiState())
    val state = _state.asStateFlow()
    fun load(chatId: String) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val messages = async { runCatching { api.messages(chatId).data.orEmpty() }.getOrNull() }
        val me = async { runCatching { accountApi.me().data?.id.orEmpty() }.getOrNull() }
        val loaded = messages.await(); val userId = me.await()
        _state.value = ChatDetailUiState(loading = false, messages = loaded.orEmpty(), ownUserId = userId.orEmpty(), error = if (loaded == null || userId == null) "Không thể tải cuộc trò chuyện" else null)
    }
    fun send(chatId: String, content: String) = viewModelScope.launch {
        val text = content.trim()
        if (text.isBlank() || text.length > 2_000) {
            _state.value = _state.value.copy(error = "Tin nhắn phải có từ 1 đến 2.000 ký tự")
            return@launch
        }
        _state.value = _state.value.copy(sending = true, error = null)
        runCatching { api.send(chatId, SendMessageRequest(text)).data ?: error("Không thể gửi") }
            .onSuccess { message -> _state.value = _state.value.copy(sending = false, messages = _state.value.messages + message) }
            .onFailure { _state.value = _state.value.copy(sending = false, error = "Không thể gửi tin nhắn") }
    }
}
