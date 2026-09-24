package com.tattantat.app.presentation.sell

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.RemoteProductRepository
import com.tattantat.app.domain.product.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MyListingsState(
    val items: List<Product> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

@HiltViewModel
class MyListingsViewModel @Inject constructor(
    private val products: RemoteProductRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(MyListingsState())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { products.mine() }
            .onSuccess { _state.value = MyListingsState(items = it, loading = false) }
            .onFailure {
                _state.value = MyListingsState(
                    items = emptyList(),
                    loading = false,
                    error = null,
                )
            }
    }

    fun setVisibility(productId: String, status: String) = viewModelScope.launch {
        runCatching { products.setListingVisibility(productId, status) }
            .onSuccess {
                _state.value = _state.value.copy(items = _state.value.items.map {
                    if (it.id == productId) it.copy(status = status) else it
                })
            }
            .onFailure { _state.value = _state.value.copy(error = "Không thể cập nhật trạng thái tin. Vui lòng thử lại.") }
    }

    fun deleteListings(ids: List<String>) = viewModelScope.launch {
        val remaining = _state.value.items.filterNot { it.id in ids }
        _state.value = _state.value.copy(items = remaining)
    }
}
