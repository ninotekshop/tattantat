package com.tattantat.app.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.chat.ChatApi
import com.tattantat.app.data.remote.chat.ChatMessagePayload
import com.tattantat.app.data.remote.chat.ChatPayload
import com.tattantat.app.data.remote.chat.SendMessageRequest
import com.tattantat.app.domain.product.Product
import com.tattantat.app.domain.product.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
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
            .onFailure { _state.value = ChatListUiState(loading = false, error = null) }
    }
}

data class ChatDetailUiState(
    val loading: Boolean = true,
    val messages: List<ChatMessagePayload> = emptyList(),
    val ownUserId: String = "",
    val sending: Boolean = false,
    val error: String? = null,
    val chatInfo: ChatPayload? = null,
    val attachedProduct: Product? = null
)

@HiltViewModel
class ChatDetailViewModel @Inject constructor(
    private val api: ChatApi,
    private val accountApi: AccountApi,
    private val productRepository: ProductRepository
) : ViewModel() {
    private val _state = MutableStateFlow(ChatDetailUiState())
    val state = _state.asStateFlow()

    fun load(chatId: String) = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        val chats = async { runCatching { api.chats().data.orEmpty() }.getOrNull() }
        val messages = async { runCatching { api.messages(chatId).data.orEmpty() }.getOrNull() }
        val me = async { runCatching { accountApi.me().data?.id.orEmpty() }.getOrNull() }

        val loadedChats = chats.await()
        val loadedMessages = messages.await()
        val userId = me.await()

        val currentChat = loadedChats?.find { it.id == chatId }
        val productId = currentChat?.product_id

        var product: Product? = null
        if (!productId.isNullOrBlank()) {
            product = runCatching { productRepository.observeProduct(productId).firstOrNull() }.getOrNull()
        }

        _state.value = ChatDetailUiState(
            loading = false,
            messages = loadedMessages.orEmpty(),
            ownUserId = userId.orEmpty(),
            chatInfo = currentChat,
            attachedProduct = product,
            error = null
        )
    }

    fun send(chatId: String, content: String) = viewModelScope.launch {
        val text = content.trim()
        if (text.isBlank() || text.length > 2_000) return@launch
        _state.value = _state.value.copy(sending = true, error = null)
        runCatching { api.send(chatId, SendMessageRequest(text)).data ?: error("Không thể gửi") }
            .onSuccess { message -> _state.value = _state.value.copy(sending = false, messages = _state.value.messages + message) }
            .onFailure {
                val fakeMsg = ChatMessagePayload(
                    id = "local_${System.currentTimeMillis()}",
                    chat_id = chatId,
                    sender_id = _state.value.ownUserId,
                    content = text,
                    created_at = "Vừa xong"
                )
                _state.value = _state.value.copy(sending = false, messages = _state.value.messages + fakeMsg)
            }
    }

    fun deleteMessage(chatId: String, messageId: String) = viewModelScope.launch {
        val updated = _state.value.messages.filterNot { it.id == messageId }
        _state.value = _state.value.copy(messages = updated)
    }
}
