package com.tattantat.app.presentation.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.RemoteProductRepository
import com.tattantat.app.domain.product.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavoritesUiState(val loading: Boolean = true, val products: List<Product> = emptyList(), val error: String? = null)

@HiltViewModel
class FavoritesViewModel @Inject constructor(private val products: RemoteProductRepository) : ViewModel() {
    private val _state = MutableStateFlow(FavoritesUiState())
    val state = _state.asStateFlow()
    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, error = null)
        runCatching { products.favorites() }
            .onSuccess { _state.value = FavoritesUiState(loading = false, products = it) }
            .onFailure { _state.value = FavoritesUiState(loading = false, error = null) }
    }

    fun remove(product: Product) = viewModelScope.launch {
        val updated = _state.value.products.filterNot { it.id == product.id }
        _state.value = _state.value.copy(products = updated, error = null)
        runCatching { products.toggleFavorite(product.id, true) }
    }
}
