package com.tattantat.app.presentation.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.domain.product.Product
import com.tattantat.app.domain.product.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.tattantat.app.data.repository.RemoteProductRepository
import com.tattantat.app.data.remote.chat.ChatApi
import com.tattantat.app.data.remote.chat.OpenChatRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.Job
import javax.inject.Inject
import com.tattantat.app.data.remote.product.CategoryPayload
import com.tattantat.app.data.remote.account.AccountApi
import com.tattantat.app.data.remote.account.ReportRequest

@HiltViewModel
class ProductViewModel @Inject constructor(private val repository: ProductRepository, private val chats: ChatApi, private val account: AccountApi) : ViewModel() {
    private val remote = repository as? RemoteProductRepository
    val products: StateFlow<List<Product>> = repository.observeProducts().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    private val _openedChatId = MutableStateFlow<String?>(null)
    val openedChatId = _openedChatId.asStateFlow()
    private val _chatError = MutableStateFlow<String?>(null)
    val chatError = _chatError.asStateFlow()
    private val _detail = MutableStateFlow<Product?>(null)
    val detail = _detail.asStateFlow()
    private val _detailLoading = MutableStateFlow(false)
    val detailLoading = _detailLoading.asStateFlow()
    private val _detailError = MutableStateFlow<String?>(null)
    val detailError = _detailError.asStateFlow()
    private val _searchResults = MutableStateFlow<List<Product>>(emptyList())
    val searchResults = _searchResults.asStateFlow()
    private val _searching = MutableStateFlow(false)
    val searching = _searching.asStateFlow()
    private val _searchError = MutableStateFlow<String?>(null)
    val searchError = _searchError.asStateFlow()
    private val _reportMessage = MutableStateFlow<String?>(null)
    val reportMessage = _reportMessage.asStateFlow()
    private var searchJob: Job? = null
    private val _favoriteIds = MutableStateFlow<Set<String>>(emptySet())
    val favoriteIds = _favoriteIds.asStateFlow()
    private val _categories = MutableStateFlow<List<CategoryPayload>>(emptyList())
    val categories = _categories.asStateFlow()

    init { refreshFavorites(); loadCategories() }

    private fun loadCategories() = viewModelScope.launch {
        runCatching { remote?.categories().orEmpty() }.onSuccess { _categories.value = it }
    }

    fun refreshFavorites() = viewModelScope.launch {
        remote ?: return@launch
        runCatching { remote.favorites().map { it.id }.toSet() }.onSuccess { _favoriteIds.value = it }
    }

    fun toggleFavorite(id: String) = viewModelScope.launch {
        val saved = id in _favoriteIds.value
        // Optimistic rendering keeps the heart responsive; restore its previous
        // state if the authenticated API request does not complete.
        _favoriteIds.value = if (saved) _favoriteIds.value - id else _favoriteIds.value + id
        runCatching { remote?.toggleFavorite(id, saved) }
            .onFailure { _favoriteIds.value = if (saved) _favoriteIds.value + id else _favoriteIds.value - id }
    }
    fun openChat(productId: String) { viewModelScope.launch {
        _chatError.value = null
        runCatching { chats.open(OpenChatRequest(productId)).data ?: error("Không thể mở cuộc trò chuyện") }
            .onSuccess { _openedChatId.value = it.id }
            .onFailure { _chatError.value = "Không thể mở cuộc trò chuyện" }
    } }
    fun consumedOpenedChat() { _openedChatId.value = null }
    fun loadDetail(id: String) {
        viewModelScope.launch {
            _detail.value = null
            _detailError.value = null
            _detailLoading.value = true
            runCatching { repository.observeProduct(id).first() }
                .onSuccess { product ->
                    _detail.value = product
                    if (product == null) _detailError.value = "Sản phẩm không còn được bán hoặc không tồn tại."
                }
                .onFailure { _detailError.value = "Không thể tải chi tiết sản phẩm. Vui lòng thử lại." }
            _detailLoading.value = false
        }
    }
    fun search(query: String, categoryId: Long? = null) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            _searching.value = true
            _searchError.value = null
            runCatching { repository.observeProducts(query.trim(), categoryId).first() }
                .onSuccess { _searchResults.value = it }
                .onFailure { _searchError.value = "Không thể tìm kiếm lúc này. Vui lòng thử lại." }
            _searching.value = false
        }
    }
    fun reportProduct(productId: String, reason: String, details: String?) = viewModelScope.launch {
        runCatching { account.report(ReportRequest(productId = productId, reason = reason, details = details)).data ?: error("Không thể gửi báo cáo") }
            .onSuccess { _reportMessage.value = "Đã gửi báo cáo. Cảm ơn bạn đã hỗ trợ giữ cộng đồng an toàn." }
            .onFailure { _reportMessage.value = "Không thể gửi báo cáo. Vui lòng thử lại." }
    }
    fun blockSeller(sellerId: String) = viewModelScope.launch {
        if (sellerId.isBlank()) { _reportMessage.value = "Không xác định được người bán."; return@launch }
        runCatching { account.blockUser(sellerId).data ?: error("Không thể chặn") }
            .onSuccess { _reportMessage.value = "Đã chặn người bán này." }
            .onFailure { _reportMessage.value = "Không thể chặn người bán. Vui lòng thử lại." }
    }
}
