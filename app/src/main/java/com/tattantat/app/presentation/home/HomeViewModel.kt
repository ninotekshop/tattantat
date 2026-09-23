package com.tattantat.app.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tattantat.app.data.repository.HomeRepository
import com.tattantat.app.domain.category.Category
import com.tattantat.app.domain.product.Product
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

data class HomeUiState(val categories: List<Category> = emptyList(), val nearby: List<Product> = emptyList())

@HiltViewModel
class HomeViewModel @Inject constructor(private val repository: HomeRepository) : ViewModel() {
    private val refreshTrigger = MutableStateFlow(0)

    val state = combine(refreshTrigger, repository.observeCategories(), repository.observeNearbyProducts()) { _, cats, prods ->
        HomeUiState(categories = cats, nearby = prods)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    fun refresh() {
        refreshTrigger.value += 1
    }
}
