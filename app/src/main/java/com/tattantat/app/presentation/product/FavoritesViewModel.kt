package com.tattantat.app.presentation.product

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.RemoteProductRepository
import com.tattantat.app.domain.product.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class FavoritesUiState(val loading: Boolean = true, val products: List<Product> = emptyList(), val error: String? = null)

@HiltViewModel
class FavoritesViewModel @Inject constructor(private val products: RemoteProductRepository) : ViewModel() {
    private val favoriteIds = products.favoriteIds
    private val _rawProducts = MutableStateFlow<List<Product>>(emptyList())
    private val _loading = MutableStateFlow(true)

    val state: StateFlow<FavoritesUiState> = combine(_rawProducts, favoriteIds, _loading) { raw, favIds, loading ->
        FavoritesUiState(
            loading = loading,
            products = raw.filter { it.id in favIds }
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), FavoritesUiState())

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _loading.value = true
        runCatching { products.favorites() }
            .onSuccess {
                _rawProducts.value = it
                _loading.value = false
            }
            .onFailure {
                _loading.value = false
            }
    }

    fun remove(product: Product) = viewModelScope.launch {
        products.toggleFavorite(product.id, true)
    }
}
